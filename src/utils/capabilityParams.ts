export interface CapabilityInputDefinition {
  name: string;
  type?: string;
  description?: string;
  default?: unknown;
  enum?: string[];
  format?: string;
  title?: string;
  required?: boolean;
  /** JSON Schema `examples`; the first one is offered in the form. */
  examples?: unknown[];
  /** Non-null variant types of a union (`anyOf`/`oneOf`/type list), e.g. `['string', 'array']`. */
  unionTypes?: string[];
  /** Badge text for union schemas, e.g. `string | string[]` or `integer | null`. */
  typeLabel?: string;
}

type SchemaLike = Record<string, any>;

/** Flatten `anyOf`/`oneOf` and `type: [...]` into single-type variants. */
const schemaVariants = (schema: SchemaLike): SchemaLike[] => {
  if (Array.isArray(schema.type)) {
    return schema.type.filter((type: unknown) => typeof type === 'string').map((type: string) => ({ ...schema, type }));
  }
  const options = Array.isArray(schema.anyOf) ? schema.anyOf : Array.isArray(schema.oneOf) ? schema.oneOf : undefined;
  if (options && typeof schema.type !== 'string') {
    return options.flatMap((option: unknown) => (
      option && typeof option === 'object' ? schemaVariants({ ...(option as SchemaLike) }) : []
    ));
  }
  return [schema];
};

const variantTypeName = (schema: SchemaLike): string | undefined => {
  if (typeof schema.type !== 'string') return undefined;
  if (schema.type !== 'array') return schema.type;
  const items = schema.items && typeof schema.items === 'object' && !Array.isArray(schema.items)
    ? describeSchemaType(schema.items)
    : undefined;
  if (!items) return 'array';
  return items.includes('|') ? `(${items})[]` : `${items}[]`;
};

/** A compact TypeScript-style type for a schema: `string`, `string[]`, `string | string[]`. */
export const describeSchemaType = (schema: SchemaLike): string | undefined => {
  const names = [...new Set(schemaVariants(schema).map(variantTypeName).filter(Boolean))];
  return names.length > 0 ? names.join(' | ') : undefined;
};

/**
 * Resolve union schemas for the form: a nullable single type (`string | null`)
 * renders as that type; a real union keeps `type` unset and lists its variants.
 */
const resolveInputDefinition = (definition: CapabilityInputDefinition & SchemaLike): CapabilityInputDefinition => {
  if (typeof definition.type === 'string') return definition;
  const variants = schemaVariants(definition);
  const types = [...new Set(variants.map((variant) => variant.type).filter((type) => typeof type === 'string'))];
  if (types.length === 0) return definition;
  const nonNull = types.filter((type) => type !== 'null');
  const typeLabel = describeSchemaType(definition);
  if (nonNull.length <= 1) {
    const type = nonNull[0] ?? 'null';
    const variant = variants.find((candidate) => candidate.type === type) ?? {};
    return { ...variant, ...definition, type, typeLabel };
  }
  return { ...definition, type: undefined, unionTypes: nonNull, typeLabel };
};

/** Form guidance for a union field: how to enter each accepted shape. */
export const getUnionInputHelp = (definition: CapabilityInputDefinition): string | undefined => {
  const types = definition.unionTypes;
  if (!types) return undefined;
  const accepts = (type: string) => types.includes(type);
  if (accepts('string') && accepts('array')) {
    return 'Plain text for one value, or a JSON array for several.';
  }
  const shapes = [
    accepts('string') && 'plain text',
    (accepts('number') || accepts('integer')) && 'a number',
    accepts('boolean') && 'true or false',
    accepts('array') && 'a JSON array',
    accepts('object') && 'a JSON object',
  ].filter(Boolean) as string[];
  const last = shapes.pop();
  return shapes.length > 0 ? `Enter ${shapes.join(', ')} or ${last}.` : last ? `Enter ${last}.` : undefined;
};

/** A sample value named by the description, as in "in owner/repo format". */
const describedFormat = (description: string | undefined): string | undefined => (
  description?.match(/\bin\s+[`'"]?([\w./:@{}-]+)[`'"]?\s+format\b/i)?.[1]
);

/**
 * Placeholder for a field that takes one string or an array of them: the
 * concrete syntax of both shapes, using the format the description names.
 */
export const getUnionPlaceholder = (definition: CapabilityInputDefinition): string | undefined => {
  const types = definition.unionTypes;
  if (!types?.includes('string') || !types.includes('array')) return undefined;
  const sample = describedFormat(definition.description) ?? 'value';
  return `${sample} or ["${sample}", …]`;
};

/** The first example value the schema provides for a field, if any. */
export const getExampleValue = (definition: CapabilityInputDefinition): unknown => {
  if (Array.isArray(definition.examples) && definition.examples.length > 0) return definition.examples[0];
  return undefined;
};

/** A short, single-line rendering of an example for hints and placeholders. */
export const formatExampleValue = (value: unknown): string => {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > 60 ? `${text.slice(0, 57)}…` : text;
};

const CODE_FIELD_NAMES = new Set(['code', 'script', 'sql', 'body', 'snippet']);
const CODE_MEDIA_TYPE = /^(application\/(javascript|typescript|sql|x-sh)|text\/(javascript|typescript|x-python|x-sql|x-shellscript))\b/i;

/**
 * String fields that carry source text (`code`, `script`, `sql`, `body`, …)
 * get a multi-line monospace editor instead of a one-line input.
 */
export const isCodeLikeDefinition = (
  definition: CapabilityInputDefinition & { contentMediaType?: unknown }
): boolean => {
  if (definition.type !== undefined && definition.type !== 'string') return false;
  if (definition.enum || definition.unionTypes) return false;
  if (typeof definition.contentMediaType === 'string' && CODE_MEDIA_TYPE.test(definition.contentMediaType)) return true;
  if (definition.format === 'code') return true;
  return CODE_FIELD_NAMES.has(definition.name.toLowerCase());
};

export interface CapabilityInputSpec {
  definitions: CapabilityInputDefinition[];
  required: string[];
}

export const getCapabilityInputSpec = (item: any): CapabilityInputSpec => {
  const inputSchema = item?.inputSchema || item?.input_schema;
  if (inputSchema?.properties) {
    return {
      definitions: Object.entries(inputSchema.properties).map(([name, schema]) => resolveInputDefinition({
        name,
        ...(schema as object),
      })),
      required: Array.isArray(inputSchema.required) ? inputSchema.required : [],
    };
  }

  if (Array.isArray(item?.arguments)) {
    return {
      definitions: item.arguments,
      required: item.arguments
        .filter((argument: CapabilityInputDefinition) => argument.required)
        .map((argument: CapabilityInputDefinition) => argument.name),
    };
  }

  return { definitions: [], required: [] };
};

export const hasParameterValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return false;
  return typeof value !== 'string' || value.trim().length > 0;
};

export const getMissingRequiredParams = (
  item: any,
  params: Record<string, unknown>
): string[] => {
  const { required } = getCapabilityInputSpec(item);
  return required.filter((name) => !hasParameterValue(params[name]));
};

/** Accept flat single-quoted string arrays copied from schema examples, without evaluating code. */
export const normalizeArrayQuotes = (value: string): string => {
  const single = "'(?:[^'\\\\]|\\\\.)*'";
  const double = '"(?:[^"\\\\]|\\\\.)*"';
  const item = `(?:${single}|${double})`;
  if (!new RegExp(`^\\s*\\[\\s*${item}(?:\\s*,\\s*${item})*\\s*\\]\\s*$`).test(value)) return value;
  return value.replace(new RegExp(`${double}|${single}`, 'g'), (token) => {
    if (token.startsWith('"')) return token;
    // JSON handles standard escapes; only apostrophe escapes need conversion.
    const content = token.slice(1, -1).replace(/\\(.)|"/g, (match, escaped) => {
      if (escaped === "'") return "'";
      return escaped === undefined ? '\\"' : match;
    });
    try { return JSON.stringify(JSON.parse(`"${content}"`)); } catch { return token; }
  });
};

/**
 * A union field's text becomes the variant it reads as: `[...]`/`{...}` JSON
 * when the union has an array/object member, otherwise text, a number, or a boolean.
 */
export const parseUnionValue = (name: string, types: string[], value: string): unknown => {
  const text = value.trim();
  const json = (text.startsWith('[') && types.includes('array')) || (text.startsWith('{') && types.includes('object'));
  if (json) {
    try {
      return JSON.parse(text.startsWith('[') ? normalizeArrayQuotes(text) : text);
    } catch {
      throw new Error(`“${name}” looks like JSON but is not valid JSON.`);
    }
  }
  if (types.includes('string')) return value;
  if ((types.includes('number') || types.includes('integer')) && text !== '' && Number.isFinite(Number(text))) {
    return Number(text);
  }
  if (types.includes('boolean') && (text === 'true' || text === 'false')) return text === 'true';
  return value;
};

export const normalizeCapabilityParams = (
  item: any,
  params: Record<string, unknown>
): Record<string, unknown> => {
  const normalized = { ...params };
  const { definitions, required } = getCapabilityInputSpec(item);

  for (const definition of definitions) {
    const value = normalized[definition.name];
    if (definition.unionTypes && typeof value === 'string') {
      if (!value.trim() && !required.includes(definition.name)) delete normalized[definition.name];
      else normalized[definition.name] = parseUnionValue(definition.name, definition.unionTypes, value);
      continue;
    }
    if (typeof value !== 'string' || (definition.type !== 'object' && definition.type !== 'array')) {
      continue;
    }

    if (!value.trim() && !required.includes(definition.name)) {
      delete normalized[definition.name];
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(definition.type === 'array' ? normalizeArrayQuotes(value) : value);
    } catch {
      throw new Error(`“${definition.name}” must contain valid JSON.`);
    }

    if (definition.type === 'array' && !Array.isArray(parsed)) {
      throw new Error(`“${definition.name}” must be a JSON array.`);
    }
    if (
      definition.type === 'object'
      && (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
    ) {
      throw new Error(`“${definition.name}” must be a JSON object.`);
    }

    normalized[definition.name] = parsed;
  }

  return normalized;
};

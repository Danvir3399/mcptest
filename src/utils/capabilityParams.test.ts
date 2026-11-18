import { describe, expect, it } from 'vitest';
import {
  describeSchemaType,
  getCapabilityInputSpec,
  getMissingRequiredParams,
  getUnionPlaceholder,
  isCodeLikeDefinition,
  normalizeCapabilityParams,
} from './capabilityParams';

describe('capability parameters', () => {
  const tool = {
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        options: { type: 'object' },
        ids: { type: 'array' },
        enabled: { type: 'boolean' },
      },
      required: ['query', 'enabled'],
    },
  };

  it('reads JSON Schema and prompt argument formats', () => {
    expect(getCapabilityInputSpec(tool)).toMatchObject({
      required: ['query', 'enabled'],
      definitions: [{ name: 'query' }, { name: 'options' }, { name: 'ids' }, { name: 'enabled' }],
    });
    expect(getCapabilityInputSpec({ arguments: [{ name: 'topic', required: true }] })).toEqual({
      definitions: [{ name: 'topic', required: true }],
      required: ['topic'],
    });
  });

  it('treats false and zero as present while rejecting blank required strings', () => {
    expect(getMissingRequiredParams(tool, { query: '   ', enabled: false })).toEqual(['query']);
    expect(getMissingRequiredParams(tool, { query: 'prices', enabled: false })).toEqual([]);
  });

  it('parses object and array inputs before sending the MCP call', () => {
    expect(normalizeCapabilityParams(tool, {
      query: 'prices',
      options: '{"limit": 3}',
      ids: '["btc", "eth"]',
    })).toEqual({
      query: 'prices',
      options: { limit: 3 },
      ids: ['btc', 'eth'],
    });
  });

  it('accepts single-quoted schema examples while preserving valid JSON and rejecting expressions', () => {
    expect(normalizeCapabilityParams(tool, { ids: "['TypeScript', 'TSX']" }).ids).toEqual(['TypeScript', 'TSX']);
    expect(normalizeCapabilityParams(tool, { ids: '[1, {"name":"test"}, true]' }).ids).toEqual([1, { name: 'test' }, true]);
    expect(normalizeCapabilityParams(tool, { ids: `["O'Reilly", 'TSX']` }).ids).toEqual(["O'Reilly", 'TSX']);
    expect(() => normalizeCapabilityParams(tool, { ids: "['TSX', alert(1)]" })).toThrow('valid JSON');
    expect(() => normalizeCapabilityParams(tool, { ids: "['unfinished]" })).toThrow('valid JSON');
  });

  it('returns an actionable error for malformed structured input', () => {
    expect(() => normalizeCapabilityParams(tool, { options: '{nope}' }))
      .toThrow('“options” must contain valid JSON.');
    expect(() => normalizeCapabilityParams(tool, { ids: '{"not":"an array"}' }))
      .toThrow('“ids” must be a JSON array.');
  });
});

describe('code-like parameters', () => {
  it('gives source-text string fields a multi-line editor', () => {
    for (const name of ['code', 'script', 'sql', 'body', 'Code']) {
      expect(isCodeLikeDefinition({ name, type: 'string' })).toBe(true);
    }
    expect(isCodeLikeDefinition({ name: 'snippet' })).toBe(true);
    expect(isCodeLikeDefinition({ name: 'program_text', type: 'string', format: 'code' })).toBe(true);
    expect(isCodeLikeDefinition({ name: 'payload', type: 'string', contentMediaType: 'application/javascript' } as never)).toBe(true);
  });

  it('keeps single-line inputs for other fields and non-string types', () => {
    expect(isCodeLikeDefinition({ name: 'intent', type: 'string' })).toBe(false);
    expect(isCodeLikeDefinition({ name: 'body', type: 'object' })).toBe(false);
    expect(isCodeLikeDefinition({ name: 'code', type: 'integer' })).toBe(false);
    expect(isCodeLikeDefinition({ name: 'sql', type: 'string', enum: ['a', 'b'] })).toBe(false);
  });
});

describe('union parameters', () => {
  const repoName = { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] };
  const tool = {
    inputSchema: {
      type: 'object',
      properties: {
        repoName,
        limit: { anyOf: [{ type: 'integer' }, { type: 'null' }], default: null },
        mode: { type: ['string', 'null'], enum: ['fast', 'deep'] },
      },
      required: ['repoName'],
    },
  };

  it('labels union types the way TypeScript would', () => {
    expect(describeSchemaType(repoName)).toBe('string | string[]');
    expect(describeSchemaType({ type: 'array', items: { anyOf: [{ type: 'string' }, { type: 'number' }] } }))
      .toBe('(string | number)[]');
    expect(describeSchemaType({ type: 'array' })).toBe('array');
  });

  it('keeps real unions untyped and resolves nullable fields to their single type', () => {
    const [repo, limit, mode] = getCapabilityInputSpec(tool).definitions;
    expect(repo).toMatchObject({ type: undefined, unionTypes: ['string', 'array'], typeLabel: 'string | string[]' });
    expect(limit).toMatchObject({ type: 'integer', typeLabel: 'integer | null' });
    expect(mode).toMatchObject({ type: 'string', enum: ['fast', 'deep'], typeLabel: 'string | null' });
    expect(isCodeLikeDefinition({ name: 'body', unionTypes: ['string', 'array'] })).toBe(false);
  });

  it('sends a string | string[] value as text or as a parsed array', () => {
    expect(normalizeCapabilityParams(tool, { repoName: 'facebook/react' })).toEqual({ repoName: 'facebook/react' });
    expect(normalizeCapabilityParams(tool, { repoName: "['facebook/react', 'vercel/next.js']" }))
      .toEqual({ repoName: ['facebook/react', 'vercel/next.js'] });
    expect(() => normalizeCapabilityParams(tool, { repoName: '["facebook/react",' }))
      .toThrow('“repoName” looks like JSON but is not valid JSON.');
  });

  it('shows both accepted shapes in the placeholder, in the format the description names', () => {
    expect(getUnionPlaceholder({
      name: 'repoName',
      ...repoName,
      unionTypes: ['string', 'array'],
      description: 'GitHub repository or list of repositories (max 10) in owner/repo format',
    })).toBe('owner/repo or ["owner/repo", …]');
    expect(getUnionPlaceholder({ name: 'tags', unionTypes: ['string', 'array'], description: 'Tags to match.' }))
      .toBe('value or ["value", …]');
    expect(getUnionPlaceholder({ name: 'limit', unionTypes: ['string', 'number'] })).toBeUndefined();
  });
});

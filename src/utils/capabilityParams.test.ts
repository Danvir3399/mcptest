import { describe, expect, it } from 'vitest';
import {
  getCapabilityInputSpec,
  getMissingRequiredParams,
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

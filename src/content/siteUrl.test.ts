import { describe, expect, it } from 'vitest';
import { getSiteRelativePath } from './siteUrl';

describe('getSiteRelativePath', () => {
  it('maps mcptest.io URLs and root-relative paths to site paths', () => {
    expect(getSiteRelativePath('https://mcptest.io/learn/a#b')).toBe('/learn/a#b');
    expect(getSiteRelativePath('https://www.mcptest.io/catalog?q=x')).toBe('/catalog?q=x');
    expect(getSiteRelativePath('/docs/testing-guide')).toBe('/docs/testing-guide');
  });

  it('treats other hosts and protocol-relative links as external', () => {
    expect(getSiteRelativePath('https://glama.ai/mcp/inspector')).toBeNull();
    expect(getSiteRelativePath('https://github.com/integry/mcptest')).toBeNull();
    expect(getSiteRelativePath('https://mcptest.io.evil.example/x')).toBeNull();
    expect(getSiteRelativePath('//mcptest.io/x')).toBeNull();
    expect(getSiteRelativePath('#section')).toBeNull();
  });
});

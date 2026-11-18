import { describe, expect, it } from 'vitest';
import { isReadingShellPath } from './appRoutes';

describe('isReadingShellPath', () => {
  it('scrolls guide pages with the window', () => {
    ['/learn', '/learn/oauth-for-mcp-explained', '/guides', '/guides/', '/docs/testing-guide'].forEach(path => {
      expect(isReadingShellPath(path), path).toBe(true);
    });
  });

  it('keeps the playground and catalog in the fixed shell', () => {
    ['/', '/server/https://example.com/mcp', '/catalog', '/servers/context7/', '/space', '/learning'].forEach(path => {
      expect(isReadingShellPath(path), path).toBe(false);
    });
  });
});

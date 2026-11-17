/**
 * Links back into mcptest.io are internal routes, whatever form an article
 * writes them in. Only off-site links open a new tab and carry the external
 * `↗` marker. No runtime imports: scripts/generate-seo-pages.js requires this.
 */
const SITE_HOSTS = new Set(['mcptest.io', 'www.mcptest.io']);

/** The same-site path for an absolute mcptest.io URL, or null for any other link. */
export function getSiteRelativePath(url: string): string | null {
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' || !SITE_HOSTS.has(parsed.hostname)) return null;
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

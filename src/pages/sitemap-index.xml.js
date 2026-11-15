import { languages } from '../i18n/languages.js';
import { site } from '../lib/site.js';
import { getModel } from '../lib/data/model.js';

export function GET() {
  const { updated } = getModel();
  const entries = languages.map(
    ({ code }) =>
      `<sitemap><loc>${site.url}/sitemap-${code}.xml</loc>${updated ? `<lastmod>${updated}</lastmod>` : ''}</sitemap>`,
  );
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</sitemapindex>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
}

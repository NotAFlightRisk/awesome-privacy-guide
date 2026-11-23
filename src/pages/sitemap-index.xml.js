import { published as languages } from '../lib/published.js';
import { pagesFor } from '../lib/routes.js';
import { site } from '../lib/site.js';
import { getModel } from '../lib/data/model.js';

const newest = (dates) => dates.filter(Boolean).sort().at(-1);
const guideDates = (lang) =>
  pagesFor(lang)
    .filter((page) => page.kind === 'guide' && !page.fallback)
    .map((page) => page.entity.checked);

export function GET() {
  const { updated } = getModel();
  const entries = languages.map(({ code }) => {
    const lastmod = newest([updated, ...guideDates(code)]);
    return `<sitemap><loc>${site.url}/sitemap-${code}.xml</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</sitemap>`;
  });
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</sitemapindex>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
}

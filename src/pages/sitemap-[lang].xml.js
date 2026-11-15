import { languages } from '../i18n/languages.js';
import { alternates, pagesFor } from '../lib/routes.js';
import { site } from '../lib/site.js';

export const getStaticPaths = () => languages.map(({ code }) => ({ params: { lang: code } }));

const HIDDEN = new Set(['search']);
const escape = (url) => url.replaceAll('&', '&amp;');
const absolute = (path) => escape(new URL(path, site.url).href);

export function GET({ params: { lang } }) {
  const urls = pagesFor(lang)
    .filter((page) => !HIDDEN.has(page.kind))
    .map((page) => {
      const versions = alternates(page.id).filter((version) => version.path);
      const links = [...versions, { hreflang: 'x-default', path: versions[0].path }]
        .map((version) => `<xhtml:link rel="alternate" hreflang="${version.hreflang}" href="${absolute(version.path)}"/>`)
        .join('');
      return `<url><loc>${absolute(page.path)}</loc>${links}</url>`;
    });
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
}

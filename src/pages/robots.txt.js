import { site } from '../lib/site.js';

export const GET = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap-index.xml\n`);

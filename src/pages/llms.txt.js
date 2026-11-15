import { getModel } from '../lib/data/model.js';
import { links } from '../lib/routes.js';
import { site, upstream } from '../lib/site.js';
import { published } from '../lib/published.js';

export function GET() {
  const { categories, products, services } = getModel();
  const to = links('en');
  const url = (path) => new URL(path, site.url).href;
  const lines = [
    `# ${site.name}`,
    '',
    `> An independent guide to ${upstream.name} (${upstream.repo}), the community-curated list of privacy-respecting software and services by ${upstream.author}. ${services.length} services, every page links back to its entry on ${upstream.site}.${published.length > 1 ? ` Also in ${published.slice(1).map((lang) => lang.name).join(', ')}.` : ''}`,
    '',
    '## Topics',
    '',
    ...categories.flatMap((category) => [
      `### ${category.name}`,
      '',
      ...category.sections
        .filter((section) => section.services.length)
        .map((section) => `- [${section.name}](${url(to.section(section))}): ${section.services.map((svc) => svc.name).join(', ')}`),
      '',
    ]),
    '## Private alternatives to popular apps',
    '',
    ...products.map((product) => `- [Alternatives to ${product.name}](${url(to.product(product))})`),
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

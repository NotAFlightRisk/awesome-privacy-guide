import { getModel } from '../lib/data/model.js';
import { links } from '../lib/routes.js';
import { site, upstream } from '../lib/site.js';
import { published } from '../lib/published.js';
import { list } from '../lib/format.js';
import { getGuides } from '../lib/data/guides.js';

export function GET() {
  const { categories, products, services } = getModel();
  const guides = getGuides();
  const to = links('en');
  const url = (path) => new URL(path, site.url).href;
  const lines = [
    `# ${site.name}`,
    '',
    `> An independent guide to ${upstream.name} (${upstream.repo}), the community-curated list of privacy-respecting software and services by ${upstream.author}. ${services.length} services, every page links back to its entry on ${upstream.site}.${published.length > 1 ? ` Also in ${published.slice(1).map((lang) => lang.name).join(', ')}.` : ''}`,
    '',
    ...(guides.length
      ? [
          '## Guides',
          '',
          `Every guide in full, as Markdown: ${url('/llms-full.txt')}`,
          '',
          ...guides.map((guide) => `- [${guide.versions.en.title}](${url(to.guide(guide))}): ${guide.versions.en.description}`),
          '',
        ]
      : []),
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
    ...products.map((product) => {
      const names = product.services.map((svc) => svc.name);
      return `- [Alternatives to ${product.name}](${url(to.product(product))}): ${list(names, 'en', 8)}`;
    }),
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

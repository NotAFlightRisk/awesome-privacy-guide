// A guide's English MDX as plain Markdown, with every component turned back into words and links
import { getModel } from './data/model.js';
import { links } from './routes.js';
import { site } from './site.js';
import { t } from './i18n.js';
import { slugify } from './slug.js';

import { uses, VALUE } from './data/guides.js';

const attrs = (raw) => uses(`<X${raw}>`, 'X')[0];
const list = (raw) => (raw ? [...raw.matchAll(/['"]([^'"]+)['"]/g)].map(([, value]) => value) : undefined);

export function guideMarkdown(guide) {
  const { sections, services, products, glossary } = getModel();
  const to = links('en');
  const url = (path) => new URL(path, site.url).href;
  const link = (text, path) => (path ? `[${text}](${url(path)})` : text);
  const inline = (find, path, name) => (_, raw, text) => {
    const found = find(attrs(raw));
    return link(text ?? (found ? name(found) : Object.values(attrs(raw))[0]), found && path(found));
  };
  const picks = (_, raw) => {
    const { section: name, limit, skip, only } = attrs(raw);
    const section = sections.find((entry) => entry.name === name);
    const keep = list(only);
    return (section?.services ?? [])
      .filter((svc) => (!keep || keep.includes(svc.slug)) && !(list(skip) ?? []).includes(svc.slug))
      .slice(0, limit && Number(limit))
      .map((svc) => `- ${link(svc.name, to.service(svc))}`)
      .join('\n');
  };
  const tip = (_, raw) => {
    const { title, priority, effort } = attrs(raw);
    return `### ${title}\n\n_${t('en', `guide.priority.${priority}`)}, about ${effort} min_\n`;
  };
  const tag = (name, replace) => [
    new RegExp(`<${name}((?:\\s+\\w+=${VALUE})*)\\s*(?:/>|>([\\s\\S]*?)</${name}>)`, 'g'),
    replace,
  ];
  const page = url(to.guide(guide));
  const rules = [
    [/\{\/\*[\s\S]*?\*\/\}/g, ''],
    [/\]\(#/g, `](${page}#`],
    tag('Picks', picks),
    tag('App', inline(({ name }) => services.find((svc) => svc.slug === slugify(name)), to.service, (svc) => svc.name)),
    tag('Swap', inline(({ product }) => products.find((entry) => entry.slug === product), to.product, (entry) => entry.name)),
    tag('Term', inline(({ slug }) => glossary.find((entry) => entry.slug === slug), to.term, (entry) => entry.term)),
    [/<Path>([\s\S]*?)<\/Path>/g, (_, path) => `**${path.replaceAll('-->', '>')}**`],
    [new RegExp(`<Tip((?:\\s+\\w+=${VALUE})*)\\s*>`, 'g'), tip],
    [/<Platform name=["'](\w+)["']>/g, (_, name) => `**${t('en', `platform.${name}`)}:**`],
    [/<Region place=["'](\w+)["']>/g, (_, place) => `**${t('en', `guide.region.${place}`)}:**`],
    [/<Note kind=["'](\w+)["']>/g, (_, kind) => `**${t('en', `guide.note.${kind}`)}:**`],
    [/<\/?[A-Z]\w*[^>]*>/g, ''],
    [/\n{3,}/g, '\n\n'],
  ];
  const body = rules.reduce((text, [pattern, replace]) => text.replace(pattern, replace), guide.versions.en.body);
  return `# ${guide.versions.en.title}\n\n${guide.versions.en.description}\n\nSource: ${page}\n\n${body.trim()}\n`;
}

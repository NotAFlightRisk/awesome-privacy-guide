import { getModel } from './data/model.js';
import { getGuides, inLanguage } from './data/guides.js';
import { published as languages } from './published.js';
import { routeWords } from '../i18n/routes.js';
import { tr } from './i18n.js';
import { slugify } from './slug.js';

const LATIN = new Set(['en', 'de', 'es', 'fr', 'pt', 'it']);
const memo = (fn) => {
  const cache = new Map();
  return (lang) => (cache.has(lang) ? cache.get(lang) : cache.set(lang, fn(lang)).get(lang));
};

/** Category and section slugs in `lang`, falling back to English on a clash or a non-Latin script */
const localSlugs = memo((lang) => {
  const slugs = new Map();
  const pick = (name, english, taken) => {
    const local = LATIN.has(lang) ? slugify(tr(lang, name)) : '';
    const slug = local && !taken.has(local) ? local : english;
    if (taken.has(slug)) throw new Error(`Two pages want /${slug}/ in ${lang}`);
    taken.add(slug);
    return slug;
  };
  const top = new Set(Object.values(routeWords(lang)));
  for (const category of getModel().categories) {
    slugs.set(category, pick(category.name, category.slug, top));
    const inside = new Set();
    for (const section of category.sections) slugs.set(section, pick(section.name, section.slug, inside));
  }
  return slugs;
});

/** Every URL on the site for one language, built from the thing it's about */
export const links = memo((lang) => {
  const slugs = localSlugs(lang);
  const words = routeWords(lang);
  const base = lang === 'en' ? '' : `/${lang}`;
  const category = (entity) => `${base}/${slugs.get(entity)}/`;
  const section = (entity) => `${category(entity.category)}${slugs.get(entity)}/`;
  return {
    home: `${base}/`,
    category,
    section,
    service: (svc) => `${section(svc.section)}${svc.slug}/`,
    product: (product) => `${base}/${words.alternatives}/${product.slug}/`,
    pair: (pair) => `${base}/${words.compare}/${pair.slug}/`,
    term: (entry) => `${base}/${words.glossary}/${entry.slug}/`,
    guide: (guide) => `${base}/${words.guides}/${guide.slug}/`,
    page: (name) => `${base}/${words[name]}/`,
    searchIndex: `/api/search/${lang}.json`,
  };
});

const STATIC_PAGES = ['alternatives', 'glossary', 'stack', 'discover', 'changes', 'about', 'search'];

/** One entry per page in `lang`, with an `id` that's the same page in every language */
export const pagesFor = memo((lang) => {
  const { categories, sections, services, products, pairs, glossary } = getModel();
  const guides = getGuides();
  const to = links(lang);
  return [
    { id: 'home', kind: 'home', path: to.home },
    ...STATIC_PAGES.map((name) => ({ id: name, kind: name, path: to.page(name) })),
    ...(guides.length ? [{ id: 'guides', kind: 'guides', path: to.page('guides') }] : []),
    ...guides.map((entity) => ({
      id: `d/${entity.slug}`,
      kind: 'guide',
      path: to.guide(entity),
      entity,
      fallback: inLanguage(entity, lang).fallback,
    })),
    ...categories.map((entity) => ({ id: `c/${entity.slug}`, kind: 'category', path: to.category(entity), entity })),
    ...sections.map((entity) => ({ id: `s/${entity.key}`, kind: 'section', path: to.section(entity), entity })),
    ...services.map((entity) => ({ id: `v/${entity.key}`, kind: 'service', path: to.service(entity), entity })),
    ...products.map((entity) => ({ id: `p/${entity.slug}`, kind: 'product', path: to.product(entity), entity })),
    ...pairs.map((entity) => ({ id: `x/${entity.slug}`, kind: 'pair', path: to.pair(entity), entity })),
    ...glossary.map((entity) => ({ id: `g/${entity.slug}`, kind: 'term', path: to.term(entity), entity })),
  ];
});

const byId = memo((lang) => new Map(pagesFor(lang).map((page) => [page.id, page])));

/** The same page in every language, for the language picker */
export const alternates = (id) =>
  languages.map((lang) => ({ ...lang, path: byId(lang.code).get(id)?.path }));

/** The languages that have a real version of the page, for hreflang and the sitemap */
export const indexed = (id) =>
  alternates(id).filter((version) => version.path && !byId(version.code).get(id).fallback);

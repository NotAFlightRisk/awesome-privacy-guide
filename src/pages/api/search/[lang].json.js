import { languages } from '../../../i18n/languages.js';
import { getModel } from '../../../lib/data/model.js';
import { links } from '../../../lib/routes.js';
import { translator } from '../../../lib/i18n.js';

export const getStaticPaths = () => languages.map(({ code }) => ({ params: { lang: code } }));

const normalise = (text) =>
  text.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const entry = (type, name, url, detail, keywords = []) => ({
  t: type,
  n: name,
  s: normalise(name),
  u: url,
  d: detail,
  ...(keywords.length && { k: normalise(keywords.join(' ')) }),
});

export function GET({ params: { lang } }) {
  const { categories, sections, services, products, glossary } = getModel();
  const { t, tr } = translator(lang);
  const to = links(lang);
  const items = [
    ...products.map((product) =>
      entry('p', product.name, to.product(product), t('search.count', { count: product.services.length })),
    ),
    ...services.map((svc) =>
      entry('v', svc.name, to.service(svc), tr(svc.section.name), [
        svc.section.name,
        tr(svc.section.name),
        ...svc.section.replaces,
      ]),
    ),
    ...sections.map((section) =>
      entry('s', tr(section.name), to.section(section), tr(section.category.name), [
        section.name,
        ...section.replaces,
      ]),
    ),
    ...categories.map((category) =>
      entry('c', tr(category.name), to.category(category), t('search.count', {
        count: category.sections.reduce((sum, section) => sum + section.services.length, 0),
      }), [category.name]),
    ),
    ...glossary.map((term) =>
      entry('g', tr(term.term), to.term(term), t('nav.glossary'), [term.term, ...(term.aka ?? [])]),
    ),
  ];
  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
}

// Turns every string on the site into a translation job: what to send, and how to read it back
import { getModel } from './data/model.js';
import { hash, ui } from './i18n.js';
import { renderMarkdown } from './markdown.js';

const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const keep = (text) => `<span class="notranslate">${text}</span>`;
const unkeep = (html) => html.replace(/<span class="notranslate">([\s\S]*?)<\/span>/g, '$1');
const decode = (html) =>
  html
    .replace(/<[^>]+>/g, '')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&');

/** Wraps product names in text (never inside tags) so they don't come back as "Señal" */
export function protector(names) {
  const sorted = [...new Set(names)].filter((name) => name.length > 2).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(?<![\\w-])(${sorted.map(escapeRe).join('|')})(?![\\w-])`, 'g');
  return (html) =>
    html
      .split(/(<[^>]+>)/)
      .map((part, i) => (i % 2 ? part : part.replace(pattern, (name) => keep(name))))
      .join('');
}

/** The three shapes of job: plain names, markdown with links, and UI copy with {placeholders} */
export const kinds = (protect = (html) => html) => ({
  plain: (text) => ({ text, type: 'plain', payload: text, read: (out) => out }),

  markdown(text) {
    const links = [];
    const html = renderMarkdown(text).replace(
      /<a href="([^"]*)" rel="noopener">/g,
      (_, href) => `<a href="${links.push(href) - 1}">`,
    );
    return {
      text,
      type: 'html',
      payload: protect(html),
      read(out) {
        const html = unkeep(out).replace(/<a href=["'](\d+)["']>/g, (tag, i) =>
          links[i] ? `<a href="${links[i]}" rel="noopener">` : tag,
        );
        return /<a href=["']\d+["']/.test(html) ? undefined : html;
      },
    };
  },

  template: (text) => ({
    text,
    type: 'html',
    payload: text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replace(/\{\w+\}/g, (name) => keep(name)),
    read: (out) => decode(unkeep(out)),
  }),
});

/** Every string the site shows, deduplicated by what gets cached */
export function jobs() {
  const { categories, sections, services, glossary, products } = getModel();
  const { plain, markdown, template } = kinds(
    protector([
      ...services.map((svc) => svc.name),
      ...sections.flatMap((section) => section.mentions.map((mention) => mention.name)),
    ]),
  );
  const all = [
    ...categories.map((category) => plain(category.name)),
    ...sections.map((section) => plain(section.name)),
    ...glossary.flatMap((entry) => [entry.term, entry.short, ...(entry.aka ?? [])].map(plain)),
    ...Object.values(ui).map(template),
    ...sections.flatMap((section) =>
      [section.intro, section.warning, section.more, section.mentionsText]
        .concat(section.mentions.map((mention) => mention.description))
        .map(markdown),
    ),
    ...services.map((svc) => markdown(svc.description)),
    ...glossary.map((entry) => markdown(entry.body)),
    ...products.filter((product) => product.note).map((product) => markdown(product.note.why)),
  ].filter((job) => job.text?.trim());
  return [...new Map(all.map((job) => [hash(job.text), job])).values()];
}

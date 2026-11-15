// Turns every string on the site into a translation job: what to send, and how to read it back
import { getModel } from './data/model.js';
import { hash, ui } from './i18n.js';
import { renderMarkdown } from './markdown.js';

const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const keep = (text) => `<span class="notranslate">${text}</span>`;
const UNSPACED = new Set(['ja', 'zh-Hans', 'zh-Hant']);
const letter = (char) => /\p{L}/u.test(char ?? '');

/** Unwraps kept names, putting back the space Azure sometimes eats next to one */
const unkeep = (html, lang) =>
  html.replace(/<span class="notranslate">([\s\S]*?)<\/span>/g, (span, name, at, all) => {
    if (UNSPACED.has(lang)) return name;
    const before = letter(all[at - 1]) ? ' ' : '';
    const after = letter(all[at + span.length]) ? ' ' : '';
    return `${before}${name}${after}`;
  });
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
const BRANDS = ['ToS;DR', 'Awesome Privacy', 'awesome-privacy.xyz', 'GitHub', 'Plausible', 'Azure Translator', 'Markdown', 'JSON'];
const brands = protector(BRANDS);

export const kinds = (protect = (html) => html) => ({
  plain: (text) => ({ text, type: 'plain', payload: text, read: (out) => out }),

  // A topic name on its own comes back as "musicians" for Music Players, so it goes in a sentence
  name: (text) => ({
    text,
    type: 'html',
    payload: `Categories of privacy software: <b>${text.replaceAll('&', '&amp;')}</b>`,
    read: (out) => {
      const name = out.match(/<b>(.*?)<\/b>/)?.[1];
      return name && decode(name);
    },
  }),

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
      read(out, lang) {
        const html = unkeep(out, lang).replace(/<a href=["'](\d+)["']>/g, (tag, i) =>
          links[i] ? `<a href="${links[i]}" rel="noopener">` : tag,
        );
        return /<a href=["']\d+["']/.test(html) ? undefined : html;
      },
    };
  },

  template: (text) => ({
    text,
    type: 'html',
    payload: brands(
      text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replace(/\{\w+\}/g, (name) => keep(name)),
    ),
    read: (out, lang) => decode(unkeep(out, lang)).replace(/ ([.,])/g, '$1'),
  }),
});

/** Every string the site shows, deduplicated by what gets cached */
export function jobs() {
  const { categories, sections, services, glossary, products } = getModel();
  const { plain, name, markdown, template } = kinds(
    protector([
      ...services.map((svc) => svc.name),
      ...sections.flatMap((section) => section.mentions.map((mention) => mention.name)),
    ]),
  );
  const all = [
    ...categories.map((category) => name(category.name)),
    ...sections.map((section) => name(section.name)),
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

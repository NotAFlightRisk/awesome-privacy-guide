import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { readCache } from './data/load.js';
import { renderMarkdown } from './markdown.js';
import { byCode } from '../i18n/languages.js';

export const hash = (text) => createHash('sha1').update(text.trim()).digest('hex').slice(0, 16);

const readYaml = (file) => parse(readFileSync(resolve(process.cwd(), file), 'utf8'));

export const ui = readYaml('src/i18n/ui.yml');
const overrides = readYaml('src/i18n/overrides.yml');

const caches = new Map();
const cacheFor = (lang) => {
  if (!caches.has(lang)) caches.set(lang, readCache(lang));
  return caches.get(lang);
};

const lookup = (lang, text) =>
  lang === 'en' || !text?.trim() ? undefined : (overrides[lang]?.[text] ?? cacheFor(lang)[hash(text)]);

/** A plain string in `lang`, or the English if it hasn't been translated yet */
export const tr = (lang, text) => lookup(lang, text) ?? text;

/** Markdown in `lang` as HTML, falling back to English marked up as English */
export function trMd(lang, markdown) {
  if (!markdown?.trim()) return '';
  if (lang === 'en') return renderMarkdown(markdown);
  return lookup(lang, markdown) ?? `<div lang="en">${renderMarkdown(markdown)}</div>`;
}

const plural = (lang, key, count) => {
  if (typeof count !== 'number') return key;
  const form = new Intl.PluralRules(byCode[lang].hreflang).select(count) === 'one' ? 'one' : 'other';
  return `${key}.${form}` in ui ? `${key}.${form}` : key;
};

/** UI copy by key, with `{name}` placeholders filled from `vars` and `.one`/`.other` picked by count */
export function t(lang, key, vars = {}) {
  const english = ui[plural(lang, key, vars.count)];
  if (english === undefined) throw new Error(`No UI string called "${key}"`);
  return tr(lang, english).replace(/\{(\w+)\}/g, (match, name) => vars[name] ?? match);
}

/** Bound to one language, which is how pages use it */
export const translator = (lang) => ({
  lang,
  t: (key, vars) => t(lang, key, vars),
  tr: (text) => tr(lang, text),
  md: (markdown) => trMd(lang, markdown),
  has: (text) => lang === 'en' || lookup(lang, text) !== undefined,
});

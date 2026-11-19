// Every guide's frontmatter, tips and stamps, read once and checked against one schema
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import { hash } from '../i18n.js';
import { languages } from '../../i18n/languages.js';

export const GUIDES = 'src/content/guides';
export const FIXTURES = 'tests/fixtures/guides';
export const PRIORITIES = ['essential', 'optional', 'advanced'];

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HEX = /^[0-9a-f]+$/;

const text = (value) => typeof value === 'string' && value.trim().length > 0;
const slugs = (value) => value === undefined || (Array.isArray(value) && value.every((s) => SLUG.test(s)));
const names = (value) => value === undefined || (Array.isArray(value) && value.every(text));
const links = (value) =>
  value === undefined || (Array.isArray(value) && value.every((l) => text(l?.label) && /^https:\/\//.test(l?.url)));

const ENGLISH = {
  title: text,
  description: text,
  type: text,
  topic: text,
  published: (v) => DATE.test(v),
  checked: (v) => DATE.test(v),
  draft: (v) => v === undefined || typeof v === 'boolean',
  sections: names,
  products: slugs,
  terms: slugs,
  related: slugs,
  further: links,
};

const TRANSLATION = {
  title: text,
  description: text,
  source: (v) => v === undefined || (typeof v === 'string' && v.length === 16 && HEX.test(v)),
  sha: (v) => v === undefined || (typeof v === 'string' && v.length >= 7 && HEX.test(v)),
};

function check(data, schema, file) {
  const problems = [
    ...Object.entries(schema).filter(([key, ok]) => !ok(data[key])).map(([key]) => `bad or missing "${key}"`),
    ...Object.keys(data).filter((key) => !(key in schema)).map((key) => `unknown field "${key}"`),
  ];
  if (problems.length) throw new Error(`${file}: ${problems.join(', ')}`);
}

/** Frontmatter and body, with the body as written */
export function split(source, file) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file}: no frontmatter`);
  return { data: parse(match[1]) ?? {}, body: match[2] };
}

export const VALUE = `(?:"[^"]*"|'[^']*'|\\{[^}]*\\})`;
const ATTR = new RegExp(`(\\w+)=(${VALUE})`, 'g');

/** The attributes of every `<name ...>` in a body, in order, and a throw for any it can't read */
export function uses(body, name, file = 'guide') {
  const tag = new RegExp(`^<${name}((?:\\s+\\w+=${VALUE})*)\\s*/?>`);
  return [...body.matchAll(new RegExp(`<${name}(?=[\\s/>])`, 'g'))].map(({ index }) => {
    const match = body.slice(index).match(tag);
    if (!match) throw new Error(`${file}: can't read the <${name}> at character ${index}`);
    return Object.fromEntries([...match[1].matchAll(ATTR)].map(([, key, value]) => [key, value.slice(1, -1).trim()]));
  });
}

/** Each `<Tip>` in order, with its id, title, priority and effort in minutes */
export function tipsIn(body, file) {
  const tips = uses(body, 'Tip', file).map(({ id, title, priority, effort }) => {
    const tip = { id, title, priority, effort: Number(effort) };
    if (!SLUG.test(id ?? '') || !text(title) || !PRIORITIES.includes(priority) || !(tip.effort > 0)) {
      throw new Error(`${file}: <Tip id="${id}"> needs an id, a title, a priority (${PRIORITIES.join('/')}) and an effort in minutes`);
    }
    return tip;
  });
  const twice = tips.find((tip, i) => tips.findIndex((other) => other.id === tip.id) !== i);
  if (twice) throw new Error(`${file}: two tips have the id "${twice.id}"`);
  return tips;
}

/** The component names and tip ids in order, which every fresh translation has to match */
export const shape = (body) =>
  [...body.matchAll(/<([A-Z]\w*)\b(?:[^>]*?\bid=["']([^"']*)["'])?/g)]
    .filter(([, name]) => name !== 'Local')
    .map(([, name, id]) => (id ? `${name}#${id}` : name));

const words = (body) =>
  body
    .replace(/^\[\^[^\]]+\]:.*$/gm, '')
    .replace(/<[^>]+>|[#*_`[\]()]/g, ' ')
    .trim();

/** Minutes to read, at a steady pace for each script */
export function readingTime(body, lang) {
  const plain = words(body);
  const units = lang === 'ja' ? plain.replace(/\s/g, '').length / 500 : plain.split(/\s+/).length / 220;
  return Math.max(1, Math.round(units));
}

function readVersion(dir, slug, lang) {
  const file = join(dir, slug, `${lang}.mdx`);
  if (!existsSync(resolve(process.cwd(), file))) return undefined;
  const { data, body } = split(readFileSync(resolve(process.cwd(), file), 'utf8'), file);
  check(data, lang === 'en' ? ENGLISH : TRANSLATION, file);
  return {
    lang,
    file: `/${file}`,
    title: data.title,
    description: data.description,
    data,
    body,
    hash: hash(body),
    tips: tipsIn(body, file),
    minutes: readingTime(body, lang),
  };
}

function readGuide(dir, slug) {
  if (!SLUG.test(slug)) throw new Error(`${dir}/${slug}: folder names are the slug, in lowercase-with-dashes`);
  const en = readVersion(dir, slug, 'en');
  if (!en) throw new Error(`${dir}/${slug}: no en.mdx`);
  const versions = { en };
  for (const { code } of languages.slice(1)) {
    const version = readVersion(dir, slug, code);
    if (version?.data.source && version.data.sha) versions[code] = { ...version, stale: version.data.source !== en.hash };
  }
  const { title, description, draft, sections = [], products = [], terms = [], related = [], further = [], ...rest } =
    en.data;
  return { slug, ...rest, draft: Boolean(draft), sections, products, terms, related, further, versions };
}

const folders = (dir) =>
  existsSync(resolve(process.cwd(), dir))
    ? readdirSync(resolve(process.cwd(), dir), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    : [];

/** Every guide in `dirs`, drafts included, newest first */
export const readGuides = (dirs) =>
  dirs
    .flatMap((dir) => folders(dir).map((slug) => readGuide(dir, slug)))
    .sort((a, b) => b.published.localeCompare(a.published) || a.slug.localeCompare(b.slug));

let cache;
/** The guides the site builds: no drafts, and the test fixture only when GUIDES_FIXTURE is set */
export const getGuides = () =>
  (cache ??= readGuides(process.env.GUIDES_FIXTURE ? [GUIDES, FIXTURES] : [GUIDES]).filter((guide) => !guide.draft));

/** A guide as one language shows it: its own translation, or the English with `fallback` set */
export function inLanguage(guide, lang) {
  const version = guide.versions[lang] ?? guide.versions.en;
  return { ...version, fallback: version.lang !== lang };
}

/** Guides whose frontmatter `field` names any of `refs`, for the links in from other pages */
export const guidesNaming = (field, refs) =>
  getGuides().filter((guide) => guide[field].some((ref) => refs.includes(ref)));

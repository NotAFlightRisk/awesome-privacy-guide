// Guide upkeep: references that no longer resolve, translations to stamp, and names never to translate
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { FIXTURES, GUIDES, readGuides, uses } from '../src/lib/data/guides.js';
import { getModel } from '../src/lib/data/model.js';
import { slugify } from '../src/lib/slug.js';
import { languages } from '../src/i18n/languages.js';
import { log, summary } from './lib/log.js';

const { values: args, positionals } = parseArgs({
  allowPositionals: true,
  options: { strict: { type: 'boolean', default: false } },
});
const [command, slug, lang] = positionals;
const guides = readGuides(process.env.GUIDES_FIXTURE ? [GUIDES, FIXTURES] : [GUIDES]);

const slugsIn = (raw) => (raw ? [...raw.matchAll(/['"]([^'"]+)['"]/g)].map(([, value]) => value) : []);

/** Every reference in a guide that the list data can't answer */
function broken(guide) {
  const { sections, services, products, glossary } = getModel();
  const section = (name) => sections.find((entry) => entry.name === name);
  const body = Object.values(guide.versions).map((version) => version.body).join('\n');
  const picks = uses(body, 'Picks').flatMap(({ section: name, skip, only }) =>
    section(name)
      ? [...slugsIn(skip), ...slugsIn(only)]
          .filter((app) => !section(name).services.some((svc) => svc.slug === app))
          .map((app) => `<Picks> app "${app}" isn't in ${name}`)
      : [`<Picks> section "${name}"`],
  );
  return [
    ...guide.sections.filter((name) => !section(name)).map((name) => `section "${name}"`),
    ...guide.products.filter((s) => !products.some((p) => p.slug === s)).map((s) => `product "${s}"`),
    ...guide.terms.filter((s) => !glossary.some((g) => g.slug === s)).map((s) => `term "${s}"`),
    ...picks,
    ...uses(body, 'App').filter(({ name }) => !services.some((svc) => svc.slug === slugify(name))).map(({ name }) => `<App> "${name}"`),
    ...uses(body, 'Swap').filter(({ product }) => !products.some((p) => p.slug === product)).map(({ product }) => `<Swap> "${product}"`),
    ...uses(body, 'Term').filter((term) => !glossary.some((g) => g.slug === term.slug)).map((term) => `<Term> "${term.slug}"`),
  ];
}

function check() {
  let failed = 0;
  const lines = [];
  for (const guide of guides) {
    const problems = broken(guide);
    const missing = languages.filter(({ code }) => !guide.versions[code]).map(({ code }) => code);
    const stale = Object.values(guide.versions).filter((version) => version.stale).map((version) => version.lang);
    failed += problems.length;
    for (const problem of problems) log.error(`${guide.slug}: ${problem} doesn't resolve`);
    if (stale.length) log.warn(`${guide.slug}: stale translations (${stale.join(', ')}), the English has moved on`);
    if (missing.length) log.info(`${guide.slug}: no translation yet for ${missing.join(', ')}, so those show the English`);
    lines.push(`| ${guide.slug}${guide.draft ? ' (draft)' : ''} | ${problems.length || '✓'} | ${stale.join(', ') || '-'} | ${missing.join(', ') || '-'} |`);
  }
  log.info(`${guides.length} guides checked, ${failed} broken references`);
  if (guides.length) summary(`| Guide | Broken | Stale | Missing |\n| --- | --- | --- | --- |\n${lines.join('\n')}\n`);
  if (args.strict && failed) process.exit(1);
}

function find(name) {
  const guide = guides.find((entry) => entry.slug === name);
  if (!guide) throw new Error(`No guide called "${name}" in ${GUIDES}`);
  return guide;
}

/** Marks a translation as reviewed against the English as it is now */
function stamp() {
  const guide = find(slug);
  const file = join(dirname(guide.versions.en.file.slice(1)), `${lang}.mdx`);
  if (lang === 'en' || !existsSync(file)) throw new Error(`${slug} has no ${lang}.mdx to stamp`);
  const english = guide.versions.en.file.slice(1);
  const dirty = execFileSync('git', ['status', '--porcelain', '--', english], { encoding: 'utf8' }).trim();
  if (dirty) throw new Error(`Commit ${english} first, so the stamp points at a commit that has it`);
  const sha = execFileSync('git', ['log', '-1', '--format=%H', '--', english], { encoding: 'utf8' }).trim();
  const fields = `source: "${guide.versions.en.hash}"\nsha: "${sha}"\n`;
  const stamped = readFileSync(file, 'utf8')
    .replace(/^(source|sha): .*\n/gm, '')
    .replace(/^(---\n[\s\S]*?\n)---\n/, `$1${fields}---\n`);
  writeFileSync(file, stamped);
  log.info(`${file} stamped against ${sha.slice(0, 7)}`);
}

/** Names from the list that turn up in a guide, for the translators' do-not-translate list */
function names() {
  const { services, products, sections } = getModel();
  const text = find(slug).versions.en.body;
  const picked = uses(text, 'Picks').flatMap(({ section: name, skip, only }) =>
    (sections.find((entry) => entry.name === name)?.services ?? [])
      .filter((svc) => (!only || slugsIn(only).includes(svc.slug)) && !slugsIn(skip).includes(svc.slug))
      .map((svc) => svc.name),
  );
  const known = [
    ...services.map((svc) => svc.name),
    ...products.map((product) => product.name),
    ...sections.flatMap((section) => section.mentions.map((mention) => mention.name)),
  ];
  const escape = (name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const found = known.filter((name) => new RegExp(`(?<![\\w-])${escape(name)}(?![\\w-])`).test(text));
  console.log([...new Set([...picked, ...found])].sort((a, b) => a.localeCompare(b)).join('\n'));
}

const commands = { check, stamp, names };
if (!commands[command]) {
  console.error('Usage: npm run guides -- check [--strict] | stamp <slug> <lang> | names <slug>');
  process.exit(1);
}
commands[command]();

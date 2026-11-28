// Fills in the README's guide list from the guides the site builds
import { readFileSync, writeFileSync } from 'node:fs';
import { inLanguage, pinnedGuides } from '../src/lib/data/guides.js';
import { minutes } from '../src/lib/format.js';
import { t } from '../src/lib/i18n.js';
import { ogImage } from '../src/lib/og.js';
import { published } from '../src/lib/published.js';
import { links } from '../src/lib/routes.js';
import { site } from '../src/lib/site.js';
import { log, summary } from './lib/log.js';

const README = '.github/README.md';
const START = '<!-- guides-start -->';
const END = '<!-- guides-end -->';
const SECTION = new RegExp(`${START}[\\s\\S]*?${END}`, 'g');
const FLAGS = { pt: 'br', ja: 'jp' };
const HEADINGS = {
  start: 'New here? Start with this one',
  respond: 'If something has already gone wrong',
  switch: 'Switch to something more private',
  tips: 'Change a few settings',
  explainer: 'Get a straight answer',
};

const escape = (text) => text.replace(/[&<>"$]/g, (char) => `&#${char.charCodeAt(0)};`);
const date = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' });
const groupOf = (guide) => (guide.slug === 'start-here' ? 'start' : guide.type);
const href = (guide, lang) => site.url + links(lang).guide(guide);
const img = (src, width, alt) => `<img src="${src}" width="${width}" alt="${alt}">`;
const flag = (code) => `https://flagcdn.com/40x30/${FLAGS[code] ?? code}.png`;

const flags = (guide) =>
  published
    .slice(1)
    .filter(({ code }) => !inLanguage(guide, code).fallback)
    .map(({ code, name }) => {
      const title = escape(`${name}: ${guide.versions[code].title}`);
      return `<a href="${href(guide, code)}" title="${title}">${img(flag(code), 20, name)}</a>`;
    });

function row(guide) {
  const { title, description, tips, minutes: read } = guide.versions.en;
  const link = href(guide, 'en');
  const card = site.url + ogImage(`d/${guide.slug}`);
  const meta = [
    t('en', 'guide.read', { time: minutes(read, 'en') }),
    `${tips.length} tip${tips.length === 1 ? '' : 's'}`,
    t('en', `guides.topic.${guide.topic}`),
    `checked ${date.format(new Date(guide.checked))}`,
  ];
  return [
    '<tr>',
    '<td width="260" valign="top">',
    `<a href="${link}">${img(card, 260, escape(title))}</a>`,
    '</td>',
    '<td valign="top">',
    `<a href="${link}"><b>${escape(title)}</b></a><br>`,
    `${escape(description)}<br>`,
    `<sub>${meta.join(' · ')}</sub><br>`,
    ...flags(guide),
    '</td>',
    '</tr>',
  ].join('\n');
}

const table = (heading, members) =>
  `### ${heading}\n\n<table>\n${members.map(row).join('\n')}\n</table>`;

function list(guides) {
  const homeless = guides.find((guide) => !(groupOf(guide) in HEADINGS));
  if (homeless) {
    throw new Error(`No README heading for "${homeless.type}" guides like ${homeless.slug}`);
  }
  return Object.entries(HEADINGS)
    .map(([group, heading]) => [heading, guides.filter((guide) => groupOf(guide) === group)])
    .filter(([, members]) => members.length)
    .map(([heading, members]) => table(heading, members))
    .join('\n\n');
}

try {
  const guides = pinnedGuides();
  const readme = readFileSync(README, 'utf8');
  const found = readme.match(SECTION)?.length ?? 0;
  if (found !== 1) throw new Error(`${README} has ${found} guides-start/end pairs, wants one`);
  writeFileSync(README, readme.replace(SECTION, () => [START, list(guides), END].join('\n\n')));
  log.info(`Listed ${guides.length} guides in ${README}`);
  summary(`🪄 Listed ${guides.length} guides in the README\n`);
} catch (error) {
  log.error(error.message);
  process.exit(1);
}

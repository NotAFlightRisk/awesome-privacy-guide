import { loadData } from './load.js';
import { brandCase } from './brands.js';
import { iconSources } from './icons.js';
import { slugify } from '../slug.js';

const PLATFORMS = [
  ['windows', /windows/i],
  ['macos', /mac/i],
  ['linux', /linux/i],
  ['android', /android/i],
  ['ios', /\bios\b/i],
  ['web', /\bweb\b|pwa|\bbrowser\b(?!\s*extension)/i],
  ['extension', /extension/i],
  ['self-hosted', /self-?hosted|docker|server|\bvm\b/i],
  ['desktop', /desktop/i],
];

/** Pairs per section get a compare page, from the top of each list down */
export const COMPARE_DEPTH = 6;

const hostOf = (url) => new URL(url).hostname.replace(/^www\./, '');

const repoOf = ({ github, codeberg, git }) => {
  if (github) return { host: 'GitHub', name: github, url: `https://github.com/${github}` };
  if (codeberg) return { host: 'Codeberg', name: codeberg, url: `https://codeberg.org/${codeberg}` };
  if (git && URL.canParse(git)) return { host: hostOf(git), name: hostOf(git), url: git };
};

function platformsOf({ followWith = '', androidApp, iosApp }) {
  const found = PLATFORMS.filter(([, pattern]) => pattern.test(followWith)).map(([key]) => key);
  if (androidApp && !found.includes('android')) found.push('android');
  if (iosApp && !found.includes('ios')) found.push('ios');
  const desktops = ['windows', 'macos', 'linux'];
  return found.filter((key) => key !== 'desktop' || !found.some((p) => desktops.includes(p)));
}

function toService(raw, section, index, enrich) {
  const repo = repoOf(raw);
  const github = raw.github && enrich.github[raw.github.toLowerCase()];
  const tosdr = raw.tosdrId && enrich.tosdr[raw.tosdrId];
  return {
    kind: 'service',
    name: raw.name.trim(),
    slug: slugify(raw.name),
    key: `${section.key}/${slugify(raw.name)}`,
    url: URL.canParse(raw.url ?? '') ? raw.url : undefined,
    host: URL.canParse(raw.url ?? '') ? hostOf(raw.url) : undefined,
    iconPath: iconSources(raw).map((url) => enrich.icons[url]).find(Boolean),
    description: raw.description ?? '',
    tagline: raw.followWith,
    repo,
    github: github ?? undefined,
    tosdr: tosdr ? { id: raw.tosdrId, ...tosdr } : raw.tosdrId ? { id: raw.tosdrId } : undefined,
    android: raw.androidApp,
    ios: raw.iosApp,
    audited: raw.securityAudited === true,
    openSource: raw.openSource === true,
    crypto: raw.acceptsCrypto === true,
    discord: raw.discordInvite,
    subreddit: raw.subreddit,
    platforms: platformsOf(raw),
    position: index,
    section,
    category: section.category,
  };
}

function toSection(raw, category, enrich) {
  const section = {
    kind: 'section',
    name: raw.name.trim(),
    slug: slugify(raw.name),
    key: `${category.slug}/${slugify(raw.name)}`,
    intro: raw.intro ?? '',
    warning: raw.wordOfWarning ?? '',
    more: raw.furtherInfo ?? '',
    replaces: (raw.alternativeTo ?? []).map((name) => name.trim()).filter(Boolean),
    mentions: Array.isArray(raw.notableMentions)
      ? raw.notableMentions.map(({ name, url, description }) => ({
          name: name.trim(),
          url,
          description: description ?? '',
        }))
      : [],
    mentionsText: typeof raw.notableMentions === 'string' ? raw.notableMentions : '',
    category,
  };
  section.services = (raw.services ?? []).map((svc, i) => toService(svc, section, i, enrich));
  return section;
}

/** One product per mainstream app, with names a note groups together (Outlook, Microsoft Outlook) as one */
function toProducts(sections, notes) {
  const keyOf = (slug) => {
    const note = notes.find(({ match }) => match.some((m) => slugify(m) === slug));
    return note ? slugify(note.match[0]) : slug;
  };
  const bySlug = new Map();
  for (const section of sections) {
    for (const name of section.replaces) {
      const slug = name && keyOf(slugify(name));
      if (!slug) continue;
      const product = bySlug.get(slug) ?? { kind: 'product', slug, names: new Set(), sections: [] };
      product.names.add(name);
      if (!product.sections.includes(section)) product.sections.push(section);
      bySlug.set(slug, product);
    }
  }
  return [...bySlug.values()]
    .map(({ names, ...product }) => {
      const note = notes.find(({ match }) => match.some((m) => slugify(m) === product.slug));
      const written = [...names].find((name) => name !== name.toLowerCase()) ?? [...names][0];
      const services = product.sections.flatMap((section) => section.services);
      const aliases = [...names].map(slugify);
      return { ...product, name: note?.name ?? brandCase(written), note, services, aliases };
    })
    .filter((product) => product.services.length)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function toPairs(sections) {
  const bySlug = new Map();
  for (const section of sections) {
    const top = section.services.slice(0, COMPARE_DEPTH);
    top.forEach((a, i) =>
      top.slice(i + 1).forEach((b) => {
        const slug = `${a.slug}-vs-${b.slug}`;
        if (a.slug !== b.slug && !bySlug.has(slug)) {
          bySlug.set(slug, { kind: 'pair', slug, a, b, section });
        }
      }),
    );
  }
  return [...bySlug.values()];
}

function toChanges(changelog, services) {
  const find = ({ name, section }) =>
    services.find((svc) => svc.name === name && svc.section.name === section);
  return changelog.entries
    .map((entry) => ({
      date: entry.date,
      pr: entry.pr,
      added: (entry.changes?.services?.added ?? []).map(find).filter(Boolean),
      removed: (entry.changes?.services?.removed ?? []).map(({ name }) => name),
    }))
    .filter((entry) => entry.added.length || entry.removed.length)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function buildModel(data) {
  const enrich = {
    github: Object.fromEntries(Object.entries(data.github).map(([k, v]) => [k.toLowerCase(), v])),
    tosdr: data.tosdr,
    icons: data.icons,
  };
  const categories = data.list.categories.map((raw) => {
    const category = { kind: 'category', name: raw.name.trim(), slug: slugify(raw.name) };
    category.sections = raw.sections.map((section) => toSection(section, category, enrich));
    return category;
  });
  const sections = categories.flatMap((category) => category.sections);
  const services = sections.flatMap((section) => section.services);
  const products = toProducts(sections, data.switchFrom);
  for (const section of sections) {
    const own = section.replaces.map((name) =>
      products.find((product) => product.sections.includes(section) && product.aliases.includes(slugify(name))),
    );
    section.swaps = [...new Set(own.filter(Boolean))];
  }
  return {
    categories,
    sections,
    services,
    products,
    pairs: toPairs(sections),
    changes: toChanges(data.changelog, services),
    glossary: data.glossary,
    upstream: data.upstream,
    updated: data.changelog.generatedAt?.slice(0, 10),
  };
}

let model;
/** The whole site's data, built once per process */
export const getModel = () => (model ??= buildModel(loadData()));
export { buildModel };

// Pulls the latest list, plus the GitHub facts, ToS;DR grades and icons that go with it
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { parse } from 'yaml';
import { iconSources } from '../src/lib/data/icons.js';
import { dataPath, readEnrich } from '../src/lib/data/load.js';
import { repoPath } from '../src/lib/data/model.js';
import { log, summary } from './lib/log.js';

const RAW = 'https://raw.githubusercontent.com/lissy93/awesome-privacy/main';
const UPSTREAM = 'lissy93/awesome-privacy';
const ICON_DIR = resolve(process.cwd(), 'public/icons');
const ICON_MAX_BYTES = 2_000_000;
const ICON_SIZE = 96;
const ICON_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif', 'image/avif'];

async function get(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { 'User-Agent': 'awesomeprivacy-sync', ...init.headers },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw Object.assign(new Error(`${url} said ${res.status}`), { status: res.status });
  return res;
}

async function pool(items, size, task) {
  const queue = [...items];
  const worker = async () => {
    for (let item = queue.shift(); item !== undefined; item = queue.shift()) await task(item);
  };
  await Promise.all(Array.from({ length: size }, worker));
}

const save = (file, data) => writeFileSync(dataPath(file), `${JSON.stringify(data, null, 2)}\n`);
const servicesOf = (list) =>
  list.categories.flatMap((category) => category.sections.flatMap((section) => section.services ?? []));

/** Throws on anything the site can't build from, before a byte of it is written */
function check(list) {
  const problems = [];
  if (!list?.categories?.length) problems.push('no categories');
  for (const category of list?.categories ?? []) {
    if (!category?.name || !Array.isArray(category.sections)) problems.push(`odd category ${category?.name}`);
    for (const section of category?.sections ?? []) {
      if (!section?.name) problems.push(`a section in ${category.name} has no name`);
      if (section?.services && !Array.isArray(section.services)) problems.push(`${section.name} services`);
      for (const svc of section?.services ?? []) if (!svc?.name) problems.push(`nameless service in ${section.name}`);
    }
  }
  if (problems.length) throw new Error(`awesome-privacy.yml won't build: ${problems.join(', ')}`);
}

async function upstream() {
  const yaml = await (await get(`${RAW}/awesome-privacy.yml`)).text();
  const list = parse(yaml);
  check(list);
  const changelog = await (await get(`${RAW}/.github/changelog.json`)).text();
  JSON.parse(changelog);
  writeFileSync(dataPath('upstream/awesome-privacy.yml'), yaml);
  writeFileSync(dataPath('upstream/changelog.json'), changelog);
  return list;
}

async function graphql(query, token) {
  const res = await get('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query }),
  });
  const { data, errors = [] } = await res.json();
  if (!data) throw new Error(`GitHub GraphQL: ${errors.map((e) => e.message).join('; ') || 'no data'}`);
  const gone = new Set(errors.filter((e) => e.type === 'NOT_FOUND' && e.path?.[0]).map((e) => e.path[0]));
  return { data, gone };
}

async function github(list, token) {
  const repos = [...new Set(servicesOf(list).map((svc) => repoPath(svc.github)))].filter((slug) =>
    /^[\w.-]+\/[\w.-]+$/.test(slug ?? ''),
  );
  const previous = readEnrich('github');
  const facts = {};
  for (let i = 0; i < repos.length; i += 60) {
    const chunk = repos.slice(i, i + 60);
    const fields = chunk.map((slug, j) => {
      const [owner, name] = slug.split('/');
      return `r${j}: repository(owner: "${owner}", name: "${name}") {
        stargazerCount pushedAt isArchived licenseInfo { spdxId } }`;
    });
    const { data, gone } = await graphql(`query { ${fields.join('\n')} }`, token);
    chunk.forEach((slug, j) => {
      const repo = data[`r${j}`];
      const key = slug.toLowerCase();
      if (!repo && !gone.has(`r${j}`) && previous[key]) facts[key] = previous[key];
      if (!repo) return log.warn(`GitHub has no ${slug}`);
      facts[slug.toLowerCase()] = {
        stars: repo.stargazerCount,
        pushed: repo.pushedAt,
        archived: repo.isArchived,
        ...(repo.licenseInfo?.spdxId &&
          repo.licenseInfo.spdxId !== 'NOASSERTION' && { licence: repo.licenseInfo.spdxId }),
      };
    });
  }
  const [owner, name] = UPSTREAM.split('/');
  const { data: { repo } } = await graphql(`query { repo: repository(owner: "${owner}", name: "${name}") {
    stargazerCount forkCount } }`, token);
  const contributors = await get(`https://api.github.com/repos/${UPSTREAM}/contributors?per_page=1&anon=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const last = contributors.headers.get('link')?.match(/[?&]page=(\d+)>; rel="last"/)?.[1];
  save('enrich/github.json', facts);
  save('enrich/upstream.json', {
    stars: repo?.stargazerCount,
    forks: repo?.forkCount,
    ...(last && { contributors: Number(last) }),
  });
  return Object.keys(facts).length;
}

const pause = (ms) => new Promise((done) => setTimeout(done, ms));

async function grade(id, attempt = 1) {
  const res = await fetch(`https://api.tosdr.org/service/v3?id=${id}`, {
    headers: { 'User-Agent': 'awesomeprivacy-sync' },
    signal: AbortSignal.timeout(20_000),
  });
  if (res.status === 429 && attempt < 4) {
    await pause(15_000 * attempt);
    return grade(id, attempt + 1);
  }
  if (!res.ok) throw new Error(`said ${res.status}`);
  const { rating, name } = await res.json();
  if (!rating || !name) throw new Error('came back without a grade');
  return { rating, name };
}

/** One at a time, since ToS;DR rate limits hard. A failed lookup keeps last time's grade */
async function tosdr(list) {
  const ids = [...new Set(servicesOf(list).map((svc) => svc.tosdrId).filter(Number.isInteger))];
  const previous = readEnrich('tosdr');
  const grades = {};
  for (const id of ids) {
    try {
      grades[id] = await grade(id);
    } catch (error) {
      log.warn(`ToS;DR ${id} ${error.message}`);
      if (previous[id]) grades[id] = previous[id];
    }
    await pause(1_000);
  }
  save('enrich/tosdr.json', Object.fromEntries(Object.entries(grades).sort(([a], [b]) => a - b)));
  return `${Object.keys(grades).length}/${ids.length}`;
}

/** Tries each service's icon sources in turn, only moving on for the ones still without */
async function icons(list) {
  mkdirSync(ICON_DIR, { recursive: true });
  const sources = servicesOf(list).map(iconSources);
  const previous = readEnrich('icons');
  const found = {};
  const fetchIcon = async (url, attempt = 1) => {
    try {
      const res = await get(url);
      if (res.headers.get('x-icon-fallback') === 'true') throw new Error('no favicon, just a letter');
      const type = res.headers.get('content-type')?.split(';')[0].trim();
      const bytes = Buffer.from(await res.arrayBuffer());
      if (!ICON_TYPES.includes(type) || bytes.length > ICON_MAX_BYTES) {
        throw new Error(`${type}, ${bytes.length} bytes`);
      }
      const file = `${createHash('sha1').update(url).digest('hex').slice(0, 12)}.webp`;
      await sharp(bytes, { density: 300 })
        .resize(ICON_SIZE, ICON_SIZE, { fit: 'contain', background: '#0000' })
        .webp({ quality: 82 })
        .toFile(resolve(ICON_DIR, file));
      found[url] = `/icons/${file}`;
    } catch (error) {
      if (error.status === 429 && attempt < 4) {
        await pause(15_000 * attempt);
        return fetchIcon(url, attempt + 1);
      }
      log.debug(`Icon ${url}: ${error.message}`);
      const kept = previous[url];
      if (kept && existsSync(resolve(ICON_DIR, kept.slice('/icons/'.length)))) found[url] = kept;
    }
  };
  const missing = () => sources.filter((urls) => !urls.some((url) => found[url]));
  for (let i = 0; missing().some((urls) => urls[i]); i++) {
    await pool([...new Set(missing().map((urls) => urls[i]).filter(Boolean))], 8, fetchIcon);
  }
  const keep = new Set(Object.values(found).map((path) => path.slice('/icons/'.length)));
  for (const file of readdirSync(ICON_DIR)) if (!keep.has(file)) rmSync(resolve(ICON_DIR, file));
  save('enrich/icons.json', Object.fromEntries(Object.entries(found).sort()));
  return `${sources.length - missing().length}/${sources.length}`;
}

async function main() {
  const list = await upstream();
  const token = process.env.GITHUB_TOKEN;
  const counts = {
    services: servicesOf(list).length,
    github: token ? await github(list, token) : 'skipped, no GITHUB_TOKEN',
    tosdr: await tosdr(list),
    icons: await icons(list),
  };
  const table = Object.entries(counts).map(([key, value]) => `| ${key} | ${value} |`);
  log.info(table.join('\n'));
  summary(`### 🔄 Sync\n\n| | |\n| --- | --- |\n${table.join('\n')}\n`);
}

main().catch((error) => {
  log.error(error.message);
  process.exit(1);
});

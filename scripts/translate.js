// Fills data/i18n/<lang>.json with whatever hasn't been translated yet, within a budget
import { mkdirSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { dataPath, readCache } from '../src/lib/data/load.js';
import { hash } from '../src/lib/i18n.js';
import { translated } from '../src/i18n/languages.js';
import { log, summary } from './lib/log.js';
import { jobs } from '../src/lib/jobs.js';

const ENDPOINT = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en';
const BATCH_CHARS = 6000;
const BATCH_ITEMS = 60;

const { values: args } = parseArgs({
  options: {
    langs: { type: 'string' },
    budget: { type: 'string', default: '250000' },
    dry: { type: 'boolean', default: false },
    prune: { type: 'boolean', default: false },
  },
});

const pause = (ms) => new Promise((done) => setTimeout(done, ms));

async function send(batch, lang, key, attempt = 1) {
  const res = await fetch(`${ENDPOINT}&to=${lang.azure}&textType=${batch[0].type}`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Ocp-Apim-Subscription-Region': process.env.AZURE_TRANSLATOR_REGION || 'ukwest',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(batch.map((job) => ({ Text: job.payload }))),
  });
  if (res.status === 429 && attempt <= 6) {
    const wait = Number(res.headers.get('retry-after') || 20) * 1000 * attempt;
    log.warn(`Throttled, waiting ${wait / 1000}s`);
    await pause(wait);
    return send(batch, lang, key, attempt + 1);
  }
  if (!res.ok) throw new Error(`Translator said ${res.status}: ${await res.text()}`);
  const used = Number(res.headers.get('x-metered-usage') || 0);
  return { results: (await res.json()).map((item) => item.translations[0].text), used };
}

function batches(list) {
  const out = [];
  for (const job of list) {
    const last = out.at(-1);
    const size = last?.reduce((sum, item) => sum + item.payload.length, 0) ?? Infinity;
    const fits = last && last[0].type === job.type && last.length < BATCH_ITEMS;
    if (fits && size + job.payload.length <= BATCH_CHARS) last.push(job);
    else out.push([job]);
  }
  return out;
}

const save = (lang, cache) =>
  writeFileSync(
    dataPath('i18n', `${lang}.json`),
    `${JSON.stringify(Object.fromEntries(Object.entries(cache).sort()), null, 2)}\n`,
  );

async function main() {
  mkdirSync(dataPath('i18n'), { recursive: true });
  const key = process.env.AZURE_TRANSLATOR_KEY;
  const all = jobs();
  const wanted = args.langs?.split(',') ?? translated.map((lang) => lang.code);
  const langs = translated.filter((lang) => wanted.includes(lang.code));
  let budget = Number(args.budget);
  if (!Number.isInteger(budget) || budget < 0) throw new Error(`--budget wants a whole number, not "${args.budget}"`);
  let used = 0;
  const report = [];

  for (const lang of langs) {
    const cache = readCache(lang.code);
    const live = new Set(all.map((job) => hash(job.text)));
    if (args.prune) for (const id of Object.keys(cache)) if (!live.has(id)) delete cache[id];
    const todo = all.filter((job) => !(hash(job.text) in cache));
    const chars = todo.reduce((sum, job) => sum + job.payload.length, 0);
    report.push(`| ${lang.code} | ${all.length - todo.length} | ${todo.length} | ${chars} |`);
    if (args.dry || !todo.length) {
      if (args.prune) save(lang.code, cache);
      continue;
    }
    if (!key) {
      log.warn('No AZURE_TRANSLATOR_KEY set, so nothing gets translated');
      break;
    }
    for (const batch of batches(todo)) {
      const size = batch.reduce((sum, job) => sum + job.payload.length, 0);
      if (size > budget) {
        log.warn(`Budget spent, ${lang.code} is part done`);
        save(lang.code, cache);
        return finish(report, used);
      }
      const { results, used: metered } = await send(batch, lang, key);
      batch.forEach((job, i) => {
        const value = job.read(results[i]);
        if (value) cache[hash(job.text)] = value.trim();
        else log.warn(`${lang.code}: a link came back mangled, so that one stays in English`);
      });
      budget -= size;
      used += metered || size;
      save(lang.code, cache);
      await pause(800);
    }
    log.info(`${lang.code}: done`);
  }
  finish(report, used);
}

function finish(report, used) {
  const table = ['| lang | cached | missing | chars to send |', '| --- | --- | --- | --- |', ...report];
  log.info(`\n${table.join('\n')}\nCharacters billed this run: ${used}`);
  summary(`### 🌍 Translations\n\n${table.join('\n')}\n\nCharacters billed this run: ${used}\n`);
}

main().catch((error) => {
  log.error(error.message);
  process.exit(1);
});

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';

export const dataPath = (...parts) => resolve(process.cwd(), 'data', ...parts);

const read = (file, fallback, parser = JSON.parse) => {
  const path = dataPath(file);
  return existsSync(path) ? parser(readFileSync(path, 'utf8')) : fallback;
};

const readYaml = (file, fallback) => read(file, fallback, parse);

/** Everything the site is built from, straight off disk */
export const loadData = () => ({
  list: readYaml('upstream/awesome-privacy.yml'),
  changelog: read('upstream/changelog.json', { entries: [] }),
  github: read('enrich/github.json', {}),
  tosdr: read('enrich/tosdr.json', {}),
  upstream: read('enrich/upstream.json', {}),
  icons: read('enrich/icons.json', {}),
  glossary: readYaml('glossary.yml', []),
  switchFrom: readYaml('switch-from.yml', []),
});

export const readCache = (lang) => read(`i18n/${lang}.json`, {});
export const readEnrich = (name) => read(`enrich/${name}.json`, {});

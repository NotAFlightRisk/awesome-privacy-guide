import { languages } from '../i18n/languages.js';
import { readCache } from './data/load.js';
import { hash } from './i18n.js';
import { jobs } from './jobs.js';

const READY = 0.9;

function coverage(code) {
  const all = jobs();
  const cache = readCache(code);
  return all.filter((job) => hash(job.text) in cache).length / all.length;
}

/** English, plus every language that's at least 90% translated, so a half-done one never ships */
export const published = languages.filter(({ code }) => code === 'en' || coverage(code) >= READY);

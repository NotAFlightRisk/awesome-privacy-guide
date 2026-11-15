import { languages } from '../i18n/languages.js';
import { readCache } from './data/load.js';
import { hash } from './i18n.js';
import { jobs } from './jobs.js';

// Low enough that a week of upstream churn never takes a live language down
const READY = 0.75;

function coverage(code) {
  const cache = readCache(code);
  const sizes = jobs().map((job) => [job.payload.length, hash(job.text) in cache]);
  const total = sizes.reduce((sum, [size]) => sum + size, 0);
  return sizes.reduce((sum, [size, done]) => sum + (done ? size : 0), 0) / total;
}

/** English, plus each language with most of its text translated, so an unstarted one never ships */
export const published = languages.filter(({ code }) => code === 'en' || coverage(code) >= READY);

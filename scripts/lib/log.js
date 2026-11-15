import { appendFileSync } from 'node:fs';

const levels = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = levels[process.env.LOG_LEVEL] ?? levels.info;
const inActions = Boolean(process.env.GITHUB_ACTIONS);

const write = (level, message) => {
  if (levels[level] < threshold) return;
  const line = inActions && level !== 'info' && level !== 'debug' ? `::${level}::${message}` : message;
  (level === 'error' ? console.error : console.log)(line);
};

export const log = Object.fromEntries(
  Object.keys(levels).map((level) => [level, (message) => write(level, message)]),
);

/** Adds markdown to the Actions run summary, and does nothing anywhere else */
export const summary = (markdown) =>
  process.env.GITHUB_STEP_SUMMARY && appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);

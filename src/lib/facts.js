// What we can say about a service with evidence behind it, and nothing we can't
const OSI = new Set([
  '0BSD', 'AGPL-3.0', 'Apache-2.0', 'Artistic-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'BSL-1.0',
  'EPL-2.0', 'EUPL-1.2', 'GPL-2.0', 'GPL-3.0', 'ISC', 'LGPL-2.1', 'LGPL-3.0', 'MIT', 'MPL-2.0',
  'MS-PL', 'OSL-3.0', 'Unlicense', 'Zlib',
]);
const QUIET_AFTER_DAYS = 730;
const GRADE_TONE = { A: 'good', B: 'good', C: 'warn', D: 'bad', E: 'bad' };

const builtAt = Date.now();

export function sourceOf(svc) {
  const licence = svc.github?.licence;
  const known = OSI.has(licence) ? licence : undefined;
  if (svc.openSource || known) return { state: 'open', licence: known };
  if (svc.repo) return { state: 'public' };
  return { state: 'none' };
}

export const quietSince = (svc) => {
  const pushed = svc.github?.pushed;
  return pushed && builtAt - Date.parse(pushed) > QUIET_AFTER_DAYS * 864e5 ? pushed : undefined;
};

export const gradeOf = (svc) => svc.tosdr?.rating?.match(/^[A-E]$/)?.[0];

/** The short badges a service card shows, best news first */
export function badgesFor(svc) {
  const source = sourceOf(svc);
  const grade = gradeOf(svc);
  const quiet = quietSince(svc);
  return [
    source.state === 'open' && { key: 'badge.open', tone: 'good' },
    source.state === 'public' && { key: 'badge.public', tone: 'neutral' },
    svc.audited && { key: 'badge.audited', tone: 'good' },
    grade && { key: 'badge.tosdr', tone: GRADE_TONE[grade], vars: { grade } },
    svc.crypto && { key: 'badge.crypto', tone: 'neutral' },
    svc.github?.archived && { key: 'badge.archived', tone: 'bad' },
    !svc.github?.archived && quiet && { key: 'badge.quiet', tone: 'warn', vars: { year: quiet.slice(0, 4) } },
  ].filter(Boolean);
}

export const appLinks = (svc) =>
  [
    svc.android && { key: 'android', url: `https://play.google.com/store/apps/details?id=${svc.android}` },
    svc.ios && { key: 'ios', url: svc.ios },
  ].filter(Boolean);

export const tosdrUrl = (id) => `https://tosdr.org/en/service/${id}`;

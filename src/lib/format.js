import { byCode } from '../i18n/languages.js';
import { t } from './i18n.js';

const locale = (lang) => byCode[lang]?.hreflang ?? lang;

export const number = (value, lang) => new Intl.NumberFormat(locale(lang)).format(value);

export const compact = (value, lang) =>
  new Intl.NumberFormat(locale(lang), { notation: 'compact', maximumFractionDigits: 1 }).format(value);

export const minutes = (value, lang) =>
  new Intl.NumberFormat(locale(lang), { style: 'unit', unit: 'minute', unitDisplay: 'short' }).format(value);

export const day = (date, lang) =>
  new Intl.DateTimeFormat(locale(lang), { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(date),
  );

export const month = (date, lang) =>
  new Intl.DateTimeFormat(locale(lang), { month: 'short', year: 'numeric' }).format(new Date(date));

/** "Bitwarden, KeePass and 3 more" in whatever the language says for "and", for prose */
export const list = (items, lang, max = items.length) => {
  const shown = items.slice(0, max);
  const rest = items.length - shown.length;
  const formatter = new Intl.ListFormat(locale(lang), { type: 'conjunction' });
  return formatter.format(rest ? [...shown, t(lang, 'list.more', { count: rest })] : shown);
};

/** "Bitwarden, KeePass +3", for tight spots like index rows */
export const shortList = (items, lang, max = items.length) => {
  const rest = items.length - max;
  const shown = new Intl.ListFormat(locale(lang), { type: 'unit', style: 'short' }).format(items.slice(0, max));
  return rest > 0 ? `${shown}\u00a0+${rest}` : shown;
};

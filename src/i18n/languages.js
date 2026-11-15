/** Order is the order they're translated and listed in. `azure` is the Translator code */
export const languages = [
  { code: 'en', name: 'English', hreflang: 'en', azure: 'en' },
  { code: 'de', name: 'Deutsch', hreflang: 'de', azure: 'de' },
  { code: 'es', name: 'Español', hreflang: 'es', azure: 'es' },
  { code: 'fr', name: 'Français', hreflang: 'fr', azure: 'fr' },
  { code: 'pt', name: 'Português', hreflang: 'pt-BR', azure: 'pt' },
  { code: 'it', name: 'Italiano', hreflang: 'it', azure: 'it' },
  { code: 'ru', name: 'Русский', hreflang: 'ru', azure: 'ru' },
  { code: 'ja', name: '日本語', hreflang: 'ja', azure: 'ja' },
];

export const source = languages[0];
export const translated = languages.slice(1);
export const byCode = Object.fromEntries(languages.map((lang) => [lang.code, lang]));

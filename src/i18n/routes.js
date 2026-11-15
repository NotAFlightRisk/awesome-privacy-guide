// URL words per language, picked by hand since a lone word translates badly. ru and ja keep English
const english = {
  alternatives: 'alternatives',
  compare: 'compare',
  glossary: 'glossary',
  stack: 'stack',
  discover: 'discover',
  changes: 'new',
  about: 'about',
  search: 'search',
};

const words = {
  en: english,
  de: {
    alternatives: 'alternativen',
    compare: 'vergleich',
    glossary: 'glossar',
    stack: 'stack',
    discover: 'entdecken',
    changes: 'neu',
    about: 'ueber',
    search: 'suche',
  },
  es: {
    alternatives: 'alternativas',
    compare: 'comparar',
    glossary: 'glosario',
    stack: 'stack',
    discover: 'descubrir',
    changes: 'novedades',
    about: 'acerca-de',
    search: 'buscar',
  },
  fr: {
    alternatives: 'alternatives',
    compare: 'comparer',
    glossary: 'glossaire',
    stack: 'stack',
    discover: 'decouvrir',
    changes: 'nouveautes',
    about: 'a-propos',
    search: 'recherche',
  },
  pt: {
    alternatives: 'alternativas',
    compare: 'comparar',
    glossary: 'glossario',
    stack: 'stack',
    discover: 'descobrir',
    changes: 'novidades',
    about: 'sobre',
    search: 'pesquisa',
  },
  it: {
    alternatives: 'alternative',
    compare: 'confronto',
    glossary: 'glossario',
    stack: 'stack',
    discover: 'scopri',
    changes: 'novita',
    about: 'informazioni',
    search: 'cerca',
  },
};

export const routeWords = (lang) => words[lang] ?? english;

const repo = 'https://github.com/NotAFlightRisk/awesome-privacy-guide';

export const site = {
  name: 'Awesome Privacy Guide',
  url: 'https://awesomeprivacy.peng.ly',
  repo,
  // The correction issue form, or empty for no "report a mistake" link
  corrections: `${repo}/issues/new?template=correction.yml`,
};

export const upstream = {
  name: 'Awesome Privacy',
  repo: 'https://github.com/lissy93/awesome-privacy',
  slug: 'lissy93/awesome-privacy',
  site: 'https://awesome-privacy.xyz',
  author: 'Alicia Sykes',
  authorUrl: 'https://aliciasykes.com',
  licence: 'CC0-1.0',
};

export const upstreamLinks = {
  star: upstream.repo,
  contribute: `${upstream.repo}/blob/main/.github/CONTRIBUTING.md`,
  file: `${upstream.repo}/blob/main/awesome-privacy.yml`,
  issues: `${upstream.repo}/issues/new/choose`,
  pulls: `${upstream.repo}/pulls`,
  official: (...slugs) => [upstream.site, ...slugs].join('/'),
};

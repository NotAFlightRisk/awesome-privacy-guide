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

export const portfolio = 'https://portfolio.peng.ly';

const app = (slug, name, url) => ({ slug, name, url, logo: `${portfolio}/logos/${slug}.svg` });

// The first three get tiles on the home page, and every one is on the about page
export const moreApps = [
  app('fineprint', 'fineprint', 'https://fineprint.peng.ly'),
  app('exitformat', 'Exit Format', 'https://exitformat.peng.ly'),
  app('android-rom-compat', 'Android ROM Compat', 'https://android-rom-compat.peng.ly'),
  app('haveibeentrainedon', 'Have I Been Trained On?', 'https://haveibeentrainedon.peng.ly'),
  app('enshittification', 'The Enshittification Index', 'https://enshittification.peng.ly'),
  app('hearsay', 'hearsay', 'https://hearsay.peng.ly'),
  app('security-reporting-toolbox', 'Security Reporting Toolbox', 'https://security-reporting-toolbox.peng.ly'),
  app('statusquo', 'statusquo', 'https://statusquo.peng.ly'),
  app('patchcall', 'Patchcall', 'https://patchcall.peng.ly'),
  app('portainer-templates-extras', 'Portainer Templates Extras', 'https://portainer-templates-extras.peng.ly'),
  app('git-star-ranking', 'git-star-ranking', 'https://git-star-ranking.com'),
];

export const upstreamLinks = {
  star: upstream.repo,
  contribute: `${upstream.repo}/blob/main/.github/CONTRIBUTING.md`,
  file: `${upstream.repo}/blob/main/awesome-privacy.yml`,
  issues: `${upstream.repo}/issues/new/choose`,
  pulls: `${upstream.repo}/pulls`,
  official: (...slugs) => [upstream.site, ...slugs].join('/'),
};

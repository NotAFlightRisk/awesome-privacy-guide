<h1 align="center">
  <img width="80" src="../public/favicon.svg" alt="" /><br />
  Awesome Privacy Guide
</h1>
<p align="center">
<i>Private alternatives to the apps you use every day, from the Awesome Privacy list</i>
<br />
<b>🌐 <a href="https://awesomeprivacy.peng.ly/">awesomeprivacy.peng.ly</a></b><br />
</p>

## About

An independent, easier-to-browse front end for [lissy93/awesome-privacy](https://github.com/lissy93/awesome-privacy). Every topic, app and "instead of Gmail" swap gets its own static, indexable page, in eight languages, with comparisons, a glossary, a stack builder and an evidence panel that only shows what's on record (the list's own fields, GitHub and ToS;DR).

It doesn't add apps to the list. Every page links back to the original, and suggestions go upstream as a pull request.

---

## How the data works

- `data/upstream/` is a copy of `awesome-privacy.yml` and the changelog, pulled by `npm run sync`
- `data/enrich/` holds GitHub repo facts, ToS;DR grades and resized icons (the list's own, or the site's favicon if it hasn't got one), from the same script
- `data/i18n/<lang>.json` caches translations by a hash of the English, so only new or changed text ever gets sent to Azure Translator
- `data/glossary.yml` and `data/switch-from.yml` are ours - the glossary, and the sourced "why people switch" notes

The 🔄 Sync workflow runs that every morning, commits whatever moved, and deploys.

---

## Running it

It's a static [Astro](https://astro.build) site with a couple of [Svelte](https://svelte.dev) islands. You'll need Node 22.23.4 or newer.

```bash
git clone git@github.com:NotAFlightRisk/awesomeprivacy.git
cd awesomeprivacy
npm install
npm run dev        # dev server on localhost:4321
npm test           # the tests
npm run build      # all ~11k pages into dist/
```

To refresh the data yourself, `GITHUB_TOKEN=... npm run sync`, then `AZURE_TRANSLATOR_KEY=... npm run translate -- --budget 50000` (it never sends more characters than the budget, and with no key it just reports what's missing).

---

## Deployment

The live site is a Cloudflare Worker serving `dist/` as static assets, deployed by the 🚀 Deploy workflow on every push to `main`. It needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets.

Every release has the built site attached as `site.zip`, which runs on any static host - just unzip and serve it.

There's also a multi-arch Docker image (nginx, port 8080) on DockerHub ([`notaflightrisk/awesomeprivacy`](https://hub.docker.com/r/notaflightrisk/awesomeprivacy)) and GHCR:

```bash
docker run -p 8080:8080 notaflightrisk/awesomeprivacy
```

Or build it yourself with `docker build -t awesomeprivacy .`

---

## Licence

The code is [MIT](../LICENSE). The list data is [CC0](https://github.com/lissy93/awesome-privacy/blob/main/LICENSE) from [Alicia Sykes](https://aliciasykes.com) and the Awesome Privacy contributors.

---

<p  align="center">
  <a href="https://github.com/NotAFlightRisk"><img width="64" src="https://pixelflare.cc/iain/gif/penguin-dance.gif" /></a><br>
  <sup>
    <i>© <a href="https://github.com/NotAFlightRisk">NotAFlightRisk</a> 2026</i>
  </sup>
</p>

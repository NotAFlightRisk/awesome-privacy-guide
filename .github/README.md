<h1 align="center">
  <img width="80" src="../public/favicon.svg" alt=""><br>
  Awesome Privacy Guide
</h1>
<p align="center">
  <i>Privacy guides, alternatives and resources to help you take back control of your data</i><br>
  <b>🌐 <a href="https://awesomeprivacy.peng.ly/">awesomeprivacy.peng.ly</a></b>
</p>

## Guides

Everything you do online is worth money to someone, and it's rarely you. Protecting that data usually comes down to a few simple changes. Our guides will walk you through everything you need to know.

<!-- guides-start -->
<!-- guides-end -->

<p align="center"><a href="https://awesomeprivacy.peng.ly/guides/"><b>All the guides on awesomeprivacy.peng.ly →</b></a></p>

---

## Usage

### How the data works

- `data/upstream/` is a copy of `awesome-privacy.yml` (from [lissy93/awesome-privacy](https://github.com/lissy93/awesome-privacy)) and the changelog, pulled by `npm run sync`
- `data/enrich/` holds GitHub repo facts, ToS;DR grades and resized icons, from the same script
- `data/i18n/<lang>.json` caches translations by a hash of the English, so only new or changed text ever gets sent to Azure Translator
- `data/glossary.yml` and `data/switch-from.yml` are hand-maintained, including the glossary, and the sourced "why you should switch" notes

### Running it

It's a static [Astro](https://astro.build) site with a couple of [Svelte](https://svelte.dev) islands. You'll need Node 22.23.4 or newer.

```bash
git clone git@github.com:NotAFlightRisk/awesome-privacy-guide.git
cd awesome-privacy-guide
npm install
npm run dev        # dev server on localhost:4321
npm test           # the tests
npm run build      # all ~11k pages into dist/
```

To refresh the data yourself, `GITHUB_TOKEN=... npm run sync`, then `AZURE_TRANSLATOR_KEY=... npm run translate -- --budget 50000`

### Deployment

The live site is a Cloudflare Worker serving `dist/` as static assets, deployed by the Deploy workflow on every push to `main`.
It needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets.

Every release has the built site attached as `site.zip`, which runs on any static host - just unzip and serve it.

There's also a multi-arch Docker image (nginx, port 8080) on DockerHub ([`notaflightrisk/awesome-privacy-guide`](https://hub.docker.com/r/notaflightrisk/awesome-privacy-guide)) and GHCR:

```bash
docker run -p 8080:8080 notaflightrisk/awesome-privacy-guide
```

Or build it yourself with `docker build -t awesomeprivacy .`

---

## Licence

The code is [MIT](../LICENSE). The list data is [CC0](https://github.com/lissy93/awesome-privacy/blob/main/LICENSE) from [Alicia Sykes](https://aliciasykes.com) and the Awesome Privacy contributors. The guides' text is [CC BY 4.0](../src/content/guides/LICENSE).

---

<p align="center">
  <a href="https://github.com/NotAFlightRisk"><img width="64" src="https://pixelflare.cc/iain/gif/penguin-dance.gif" alt="NotAFlightRisk"></a><br>
  <sup>
    <i>© <a href="https://github.com/NotAFlightRisk">NotAFlightRisk</a> 2026</i>
  </sup>
</p>

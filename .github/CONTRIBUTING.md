# Contributing

Thanks for taking the time 🎉<br />
Bug reports, typo fixes and whole features are all welcome. By joining in, you agree to our [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## Ways to contribute

- 🐛 **Report a bug** - open a [bug report](https://github.com/NotAFlightRisk/awesome-privacy-guide/issues/new?template=bug_report.yml)
- 💡 **Suggest a feature** - open a [feature request](https://github.com/NotAFlightRisk/awesome-privacy-guide/issues/new?template=feature_request.yml)
- 📖 **Improve the docs** - typos, unclear wording and missing examples are all fair game
- 🔧 **Submit a fix** - see below
- 🔒 **Report a vulnerability** - please *don't* open a public issue, see [SECURITY.md](./SECURITY.md)
- 📋 **Fix a listing** - the apps, descriptions and topics all come from [Awesome Privacy](https://github.com/lissy93/awesome-privacy), so changes to those go there as a pull request, not here

---

## Getting started

```bash
git clone git@github.com:NotAFlightRisk/awesome-privacy-guide.git
cd awesome-privacy-guide
npm install
npm run dev
```

There's a bit more detail in the [Development](./README.md#development) section of the README.

---

## Guides

The guides are the one part of the site that's written here rather than pulled from the list. This is how they're built, not how they're written.

Each guide is a folder in `src/content/guides/`, named after its slug. `en.mdx` is the source and the only file with footnotes. A translation is `de.mdx`, `ja.mdx` and so on, with its own title, description and body. Anything else the guide needs, like an SVG, goes in the same folder.

```mdx
---
title: How to start using a password manager
description: Pick one from the list, move your passwords in and fix the accounts that matter most.
type: switch          # tips, switch, explainer or respond, or a new one if none fit
topic: accounts       # groups it on the hub
sections: [Password Managers]   # list sections it's about, for the links in from those pages
products: [lastpass]            # alternatives pages that get a "how to switch" box
terms: [password-manager]       # glossary terms that link back to it
related: [two-factor]           # other guides, hidden until they exist
further:
  - url: https://digital-defense.io/checklist/authentication
    label: The full authentication checklist
published: 2026-12-01
checked: 2026-12-01
draft: false          # true keeps it out of the build completely
---
```

`src/lib/data/guides.js` reads and checks all of that, and the routes, hub, cross-links, search, sitemap and `llms.txt` files all work off it. The guide page only takes the compiled body. Smart punctuation is off, so `-->` and `'` come out as typed.

The components get handed to every guide, so there's nothing to import:

| Component | What it's for |
| --- | --- |
| `<Short>` | the short answer at the top |
| `<Tip id priority effort title>` | one tip, with an anchor that's the same in every language. `priority` is essential, optional or advanced, and `effort` is minutes |
| `<Steps>`, `<Path>` | numbered steps, and menu paths like `<Path>Settings --> Privacy</Path>` |
| `<Platforms>`, `<Platform name>` | steps that differ by platform, as tabs (stacked without JS) |
| `<Picks section limit skip only>` | apps from a list section, in the list's order |
| `<App name>`, `<Swap product>`, `<Term slug>` | inline links to an app, an alternatives page or a glossary term |
| `<Note kind>`, `<Region place>` | a warning or info box, and advice for the UK, US or EU only |
| `<Local>` | a note for one country, only in that translation |

If a list section, app or product a guide points at disappears upstream, the block ones render nothing, the inline ones keep their text without a link, and the build logs a warning.

### Translations

A translation counts once it's stamped. After reviewing one against the English, commit `en.mdx` and run `npm run guides -- stamp <slug> <lang>`, which writes the hash of the English body and its commit into the translation's frontmatter. When the English changes later, the translation goes stale. It's still served, and `check` lists it.

A language without a stamped translation shows the English instead. Those pages are `noindex`, they're left out of the sitemap and hreflang, and they stay in the language picker.

### Checks

- `npm test` checks the frontmatter, that guides only use markup the CSP allows, and that fresh translations keep the English's components and tip ids in the same order
- `npm run guides -- check` lists references the list data can't answer and translations that are stale or missing. With `--strict` it fails on the broken references, and CI runs it that way on pull requests. It never runs in the deploy, so a list change upstream can't block the site
- `npm run guides -- names <slug>` prints the app and product names in a guide, for the translators' do-not-translate list

`tests/fixtures/guides/kitchen-sink` uses every component, in English, in German, and falling back everywhere else. It only builds with `GUIDES_FIXTURE=1 npm run build`, and `node --test "tests/build/*.test.js"` checks what comes out. With no real guides, there's no hub and the header keeps its "what's new" link.

Once a guide's slug is live it stays put. If one really has to move, add a 301 for all eight languages to both `public/_redirects` and `docker/nginx.conf`.

The "report a mistake" link on each guide comes from `corrections` in `src/lib/site.js`. Empty it and the link goes.

---

## Pull requests

1. **Open an issue first** for anything non-trivial. Saves you writing code we might not merge.
2. **Fork it**, and branch off `main`. Name it something descriptive, like `fix/timeout-handling`.
3. **Keep it focused.** One logical change per PR, please.
4. **Add tests** covering the new behaviour.
5. **Run `npm test` and `npm run build`** before you push.
6. **Open the PR**, fill in the template, and link the issue it closes.

Don't worry about getting it perfect first time, we're happy to help get it over the line.

---

### Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/), and the release notes are generated from them, so it does matter:

```
feat: add support for custom timeouts
fix: handle empty response from upstream
docs: clarify the deployment steps
```

Types are `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `build`, `ci` and `chore`. Breaking changes get a `!` (like `feat!:`) plus a `BREAKING CHANGE:` footer.

---

### What we look for

- The change does one thing, and does it clearly
- Tests pass, and new behaviour has new tests
- Docs updated if public behaviour changed
- No unrelated reformatting mixed into the diff

---

## Licensing

By contributing, you agree that your work is licensed under the [MIT License](../LICENSE) that covers this project, apart from guide text, which is [CC BY 4.0](../src/content/guides/LICENSE).

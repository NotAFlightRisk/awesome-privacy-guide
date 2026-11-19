// Checks a build made with GUIDES_FIXTURE=1, which CI does before running it
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const dist = process.env.DIST ?? 'dist';
const read = (path) => readFileSync(`${dist}/${path}`, 'utf8');
const skip = !existsSync(`${dist}/guides/kitchen-sink/index.html`) && 'needs a GUIDES_FIXTURE=1 build';
const article = (html) => html.slice(html.indexOf('<article class="guide"'), html.indexOf('</main>'));

test('smart punctuation stays off', { skip }, () => {
  const html = article(read('guides/kitchen-sink/index.html'));
  assert.match(html, /first --&gt; then/);
  assert.match(html, /it&#39;s/);
  assert.doesNotMatch(html, /[‘’“”–—…]/);
});

test('a translated guide is indexed, with hreflang to the real versions only', { skip }, () => {
  const html = read('de/ratgeber/kitchen-sink/index.html');
  assert.doesNotMatch(html, /name="robots"/);
  const hreflangs = [...html.matchAll(/hreflang="([^"]+)" href/g)].map(([, lang]) => lang);
  assert.deepEqual(hreflangs, ['en', 'de', 'x-default']);
  assert.match(html, /Das steht nur in der Übersetzung/);
});

test('a fallback guide is English, noindex, out of the sitemap and still in the picker', { skip }, () => {
  const html = read('fr/guides/kitchen-sink/index.html');
  assert.match(html, /<html lang="fr"/);
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.match(html, /<article class="guide" lang="en"/);
  assert.match(html, /data-lang="fr"/);
  assert.doesNotMatch(read('sitemap-fr.xml'), /kitchen-sink/);
  assert.match(read('sitemap-en.xml'), /kitchen-sink\/<\/loc><lastmod>/);
});

test('rendered guides carry nothing the CSP would block', { skip }, () => {
  for (const path of ['guides/kitchen-sink/index.html', 'de/ratgeber/kitchen-sink/index.html']) {
    const html = article(read(path));
    assert.doesNotMatch(html, /\sstyle=|<iframe|<form|<script(?![^>]*type="module" src="\/_astro\/)/, path);
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { published as languages } from '../../src/lib/published.js';
import { alternates, pagesFor } from '../../src/lib/routes.js';

test('no two pages share a URL, in any language', () => {
  const seen = new Map();
  for (const { code } of languages) {
    for (const page of pagesFor(code)) {
      assert.ok(!seen.has(page.path), `${page.path} is both ${seen.get(page.path)} and ${page.id}`);
      seen.set(page.path, page.id);
    }
  }
});

test('every page exists in every language, so hreflang never points nowhere', () => {
  for (const page of pagesFor('en')) {
    const versions = alternates(page.id);
    assert.equal(versions.filter((version) => version.path).length, languages.length, page.id);
  }
});

test('translated pages live under their language and English stays at the root', () => {
  assert.ok(pagesFor('en').every((page) => !/^\/(de|es|fr|pt|it|ru|ja)\//.test(page.path)));
  assert.ok(pagesFor('de').every((page) => page.path.startsWith('/de/')));
});

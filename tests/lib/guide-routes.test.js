import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.GUIDES_FIXTURE = '1';
const { alternates, indexed, pagesFor } = await import('../../src/lib/routes.js');
const { published } = await import('../../src/lib/published.js');

const id = 'd/kitchen-sink';

test('a guide has a page in every language, flagged where it falls back to English', () => {
  assert.equal(alternates(id).filter((version) => version.path).length, published.length);
  for (const { code } of published) {
    const page = pagesFor(code).find((entry) => entry.id === id);
    assert.equal(page.fallback, !['en', 'de'].includes(code), code);
  }
});

test('hreflang only lists the real translations', () => {
  assert.deepEqual(
    indexed(id).map((version) => version.code),
    published.map(({ code }) => code).filter((code) => ['en', 'de'].includes(code)),
  );
});

test('guides use the route word for each language', () => {
  assert.equal(pagesFor('en').find((page) => page.id === id).path, '/guides/kitchen-sink/');
  assert.equal(pagesFor('de').find((page) => page.id === 'guides').path, '/de/ratgeber/');
});

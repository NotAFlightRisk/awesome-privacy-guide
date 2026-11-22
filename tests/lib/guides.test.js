import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import sharp from 'sharp';
import { FIXTURES, GUIDES, readGuides, shape, split, tipsIn, uses } from '../../src/lib/data/guides.js';

test('every guide and translation has good frontmatter and tips', () => {
  assert.doesNotThrow(() => readGuides([GUIDES, FIXTURES]));
});

const guides = readGuides([GUIDES, FIXTURES]);
const versions = guides.flatMap((guide) => Object.values(guide.versions).map((version) => ({ guide, version })));
const fixture = guides.find((guide) => guide.slug === 'kitchen-sink');

test('fresh translations keep the English components, tip ids and order', () => {
  for (const { guide, version } of versions) {
    if (version.lang === 'en' || version.stale) continue;
    assert.deepEqual(shape(version.body), shape(guide.versions.en.body), version.file);
  }
});

test('guides only use markup the CSP allows', () => {
  const banned = [/<script\b/i, /<iframe\b/i, /<form\b/i, /\sstyle=/i, /\son[a-z]+=/i, /<img[^>]+src=["']?(https?:)?\/\//i];
  for (const { version } of versions) {
    for (const pattern of banned) assert.doesNotMatch(version.body, pattern, `${version.file} has ${pattern}`);
  }
});

test('the fixture uses every guide component, in English and a translation, with a language left to fall back', () => {
  const components = readdirSync('src/components/guide')
    .filter((file) => file.endsWith('.astro') && file !== 'Body.astro')
    .map((file) => file.replace('.astro', ''));
  const used = new Set([...shape(fixture.versions.en.body), ...shape(fixture.versions.de.body), 'Local'].map((name) => name.split('#')[0]));
  assert.deepEqual(components.filter((name) => !used.has(name)), []);
  assert.match(fixture.versions.de.body, /<Local>/);
  assert.equal(fixture.versions.de.stale, false);
  assert.equal(fixture.versions.fr, undefined);
});

test("a guide's own share card is a 1200x630 png", async () => {
  for (const { slug } of guides) {
    const file = `${GUIDES}/${slug}/og.png`;
    if (!existsSync(file)) continue;
    const { format, width, height } = await sharp(file).metadata();
    assert.deepEqual({ format, width, height }, { format: 'png', width: 1200, height: 630 }, file);
  }
});

test('bad frontmatter and tips are refused', () => {
  assert.throws(() => split('no frontmatter', 'x.mdx'), /no frontmatter/);
  assert.throws(() => tipsIn('<Tip id="x" priority="urgent" effort={5} title="T">', 'x.mdx'), /priority/);
  assert.throws(() => tipsIn('<Tip id="x" priority="essential" title="T">', 'x.mdx'), /effort/);
  assert.throws(() => tipsIn('<Tip id="x" priority="essential" effort={1} title="T"></Tip><Tip id="x" priority="optional" effort={2} title="U">', 'x.mdx'), /two tips/);
  assert.throws(() => uses('<Picks section=Password />', 'Picks'), /can't read/);
  assert.deepEqual(tipsIn(`<Tip id="a-b" priority='optional' effort={5} title="Go --> there">`, 'x.mdx'), [
    { id: 'a-b', title: 'Go --> there', priority: 'optional', effort: 5 },
  ]);
  assert.deepEqual(uses(`<Picks section='VPNs' skip={['x']} />`, 'Picks'), [{ section: 'VPNs', skip: "['x']" }]);
});

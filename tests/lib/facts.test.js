import { test } from 'node:test';
import assert from 'node:assert/strict';
import { badgesFor, quietSince, sourceOf } from '../../src/lib/facts.js';

const service = (extra) => ({ platforms: [], ...extra });
const daysAgo = (days) => new Date(Date.now() - days * 864e5).toISOString();

test('open source needs the flag or an OSI licence, a bare repo is just public code', () => {
  assert.equal(sourceOf(service({ openSource: true })).state, 'open');
  assert.deepEqual(sourceOf(service({ repo: {}, github: { licence: 'GPL-3.0' } })), { state: 'open', licence: 'GPL-3.0' });
  assert.equal(sourceOf(service({ repo: {}, github: { licence: 'BUSL-1.1' } })).state, 'public');
  assert.equal(sourceOf(service({})).state, 'none');
});

test('a repo goes quiet after two years without a push', () => {
  assert.equal(quietSince(service({ github: { pushed: daysAgo(100) } })), undefined);
  assert.ok(quietSince(service({ github: { pushed: daysAgo(800) } })));
});

test('an archived repo says archived, not quiet', () => {
  const keys = badgesFor(service({ github: { archived: true, pushed: daysAgo(1000) } })).map((b) => b.key);
  assert.ok(keys.includes('badge.archived'));
  assert.ok(!keys.includes('badge.quiet'));
});

test('ToS;DR grades are toned by letter and N/A is ignored', () => {
  const tone = (rating) => badgesFor(service({ tosdr: { rating } })).find((b) => b.key === 'badge.tosdr')?.tone;
  assert.equal(tone('A'), 'good');
  assert.equal(tone('C'), 'warn');
  assert.equal(tone('E'), 'bad');
  assert.equal(tone('N/A'), undefined);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = readFileSync(new URL('../../src/styles/base.css', import.meta.url), 'utf8');

test('hidden wins over a display set by a component', () => {
  // The theme and shuffle buttons ship with `hidden` for their script to take off,
  // and their own `display: inline-flex` beats the browser's [hidden] rule without this
  const rule = base.match(/(?:^|\n)\[hidden\]\s*\{([^}]*)\}/);
  assert.ok(rule, 'base.css has a [hidden] rule');
  assert.match(rule[1], /display:\s*none\s*!important/);
});

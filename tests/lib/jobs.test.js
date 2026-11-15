import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kinds, protector } from '../../src/lib/jobs.js';

test('links go out as short placeholders and come back with their real URLs', () => {
  const { markdown } = kinds();
  const job = markdown('See [Vaultwarden](https://github.com/dani-garcia/vaultwarden) too');
  assert.doesNotMatch(job.payload, /github\.com/);
  const back = job.read(job.payload.replace('See', 'Siehe').replace('too', 'auch'));
  assert.match(back, /<a href="https:\/\/github.com\/dani-garcia\/vaultwarden" rel="noopener">Vaultwarden<\/a>/);
  assert.match(back, /^<p>Siehe/);
});

test('app names are kept out of translation, but never inside a tag', () => {
  const protect = protector(['Signal', 'Session']);
  const html = protect('<p>Signal and <a href="0">Session</a> beat a weak signal</p>');
  assert.equal(html.match(/notranslate/g).length, 2);
  assert.match(html, /a weak signal/);
  assert.doesNotMatch(html, /href="<span/);
});

test('UI placeholders survive translation untouched', () => {
  const { template } = kinds();
  const job = template('{count} picks & more');
  assert.equal(job.payload, '<span class="notranslate">{count}</span> picks &amp; more');
  assert.equal(job.read('<span class="notranslate">{count}</span> Empfehlungen &amp; mehr'), '{count} Empfehlungen & mehr');
});

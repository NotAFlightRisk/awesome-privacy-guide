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

test('topic names go out inside a sentence and come back on their own', () => {
  const { name } = kinds();
  const job = name('Music Players');
  assert.match(job.payload, /<b>Music Players<\/b>/);
  assert.equal(job.read('Catégories de logiciels : <b>Lecteurs de musique</b>'), 'Lecteurs de musique');
  assert.equal(job.read('no tags at all'), undefined);
});

test('a kept name gets its space back when Azure glues it to the next word', () => {
  const { template } = kinds();
  const job = template('Kept up on GitHub by people');
  assert.equal(job.read('Gepflegt auf <span class="notranslate">GitHub</span>von Leuten', 'de'), 'Gepflegt auf GitHub von Leuten');
  assert.equal(job.read('<span class="notranslate">GitHub</span>で管理', 'ja'), 'GitHubで管理');
});

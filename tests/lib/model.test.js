import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildModel } from '../../src/lib/data/model.js';

const servicesOf = (services, github = {}) =>
  buildModel({
    list: { categories: [{ name: 'Tools', sections: [{ name: 'Apps', services }] }] },
    changelog: { entries: [] },
    github,
    tosdr: {},
    upstream: {},
    icons: {},
    glossary: [],
    switchFrom: [],
  }).services;

test('links repos the list gives as owner/name or as a full URL', () => {
  const services = servicesOf([
    { name: 'Aseprite', github: 'aseprite/aseprite' },
    { name: 'Linguist', github: 'https://github.com/translate-tools/linguist' },
    { name: 'PriEco', codeberg: 'https://codeberg.org/JojoYou/PriEco/' },
    { name: 'Nostr', github: 'https://github.com/nostr-protocol' },
  ]);
  assert.deepEqual(
    services.map(({ repo }) => [repo.name, repo.url]),
    [
      ['aseprite/aseprite', 'https://github.com/aseprite/aseprite'],
      ['translate-tools/linguist', 'https://github.com/translate-tools/linguist'],
      ['JojoYou/PriEco', 'https://codeberg.org/JojoYou/PriEco'],
      ['nostr-protocol', 'https://github.com/nostr-protocol'],
    ],
  );
});

test('finds the GitHub facts for a repo given as its full URL', () => {
  const [linguist] = servicesOf(
    [{ name: 'Linguist', github: 'https://github.com/translate-tools/linguist/' }],
    { 'translate-tools/linguist': { stars: 42 } },
  );
  assert.equal(linguist.github.stars, 42);
});

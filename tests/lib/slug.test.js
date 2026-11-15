import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../../src/lib/slug.js';

test('matches the slugs awesome-privacy.xyz uses', () => {
  assert.equal(slugify('Smart Home & IoT'), 'smart-home-iot');
  assert.equal(slugify('2-Factor Authentication'), '2-factor-authentication');
  assert.equal(slugify('Proton Mail'), 'proton-mail');
});

test('folds accents and drops anything that is not a letter or number', () => {
  assert.equal(slugify('Gestionnaires de mots de passe'), 'gestionnaires-de-mots-de-passe');
  assert.equal(slugify('Sécurité  réseau!'), 'securite-reseau');
  assert.equal(slugify('Менеджеры паролей'), '');
});

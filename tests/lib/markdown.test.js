import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clip, plainText, renderMarkdown } from '../../src/lib/markdown.js';

test('keeps line breaks but escapes any other raw HTML from upstream', () => {
  const html = renderMarkdown('One<br />two <script>alert(1)</script>');
  assert.match(html, /One<br>two/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

test('drops links that are not http, https or mailto', () => {
  assert.equal(renderMarkdown('[x](javascript:alert(1))'), '<p>x</p>\n');
  assert.match(renderMarkdown('[x](https://example.com)'), /<a href="https:\/\/example.com" rel="noopener">x<\/a>/);
});

test('plain text strips tags, links and entities for meta descriptions', () => {
  assert.equal(plainText('<p>Fast &amp; <a href="#">free</a></p>'), 'Fast & free');
});

test('clip ends on a word, never mid-word', () => {
  const clipped = clip('word '.repeat(60), 40);
  assert.ok(clipped.length <= 43);
  assert.match(clipped, /word\.\.\.$/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('./authenticated.html', import.meta.url), 'utf8');

test('uses the registered audio player custom element tag', () => {
  assert.match(html, /<ladon-audioplayer\b/);
  assert.match(html, /whenDefined\('ladon-audioplayer'\)/);
  assert.doesNotMatch(html, /<ladon-audio-player\b/);
  assert.doesNotMatch(html, /whenDefined\('ladon-audio-player'\)/);
});

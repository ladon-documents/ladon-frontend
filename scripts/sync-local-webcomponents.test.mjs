import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getLocalWebcomponentTargetDir } from './sync-local-webcomponents.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('syncs local webcomponents to the shared repository public folder', () => {
  assert.equal(getLocalWebcomponentTargetDir(repoRoot), path.join(repoRoot, 'public', 'dev-wc'));
});

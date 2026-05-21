import test from 'node:test';
import assert from 'node:assert/strict';

const runtime = await import('./ladon-static.mjs');

test('resolves release asset candidates before local development candidates', () => {
  const baseUrl = new URL('https://example.test/ui/draco/static/ladon-static.mjs');

  assert.deepEqual(runtime.resolveLadonStaticAssetCandidates('api', baseUrl), [
    'https://example.test/ui/draco/ladon-api/ladon-api-static.mjs',
    'https://example.test/ui/draco/api/dist/ladon-api/ladon-api-static.mjs',
  ]);

  assert.deepEqual(runtime.resolveLadonStaticAssetCandidates('styles', baseUrl), [
    'https://example.test/ui/draco/styles/global.css',
    'https://example.test/ui/draco/style/dist/styles/global.css',
  ]);
});

test('resolves local development asset candidates first on localhost', () => {
  const baseUrl = new URL('http://127.0.0.1:4173/static/ladon-static.mjs');

  assert.deepEqual(runtime.resolveLadonStaticAssetCandidates('api', baseUrl), [
    'http://127.0.0.1:4173/api/dist/ladon-api/ladon-api-static.mjs',
    'http://127.0.0.1:4173/ladon-api/ladon-api-static.mjs',
  ]);

  assert.deepEqual(runtime.resolveLadonStaticAssetCandidates('styles', baseUrl), [
    'http://127.0.0.1:4173/style/dist/styles/global.css',
    'http://127.0.0.1:4173/styles/global.css',
  ]);
});

test('creates the public static facade expected by standalone views', () => {
  const facade = runtime.createLadonStaticFacade({
    api: { fetchClient: { DocumentsApi: class DocumentsApi {} }, utility: { marker: true }, auth: { marker: 'auth' } },
    cssHref: 'https://example.test/ui/draco/styles/global.css',
  });

  assert.equal(typeof facade.init, 'function');
  assert.equal(facade.api.fetchClient.DocumentsApi.name, 'DocumentsApi');
  assert.equal(facade.fetchClient.DocumentsApi.name, 'DocumentsApi');
  assert.equal(facade.utility.marker, true);
  assert.equal(facade.auth.marker, 'auth');
  assert.equal(facade.cssHref, 'https://example.test/ui/draco/styles/global.css');
});

test('imports the first available API module candidate', async () => {
  const imported = [];
  const module = await runtime.importFirstAvailableModule(['release-api.mjs', 'local-api.mjs'], async (url) => {
    imported.push(url);
    if (url === 'release-api.mjs') {
      throw new Error('missing release api');
    }
    return { fetchClient: { ok: true }, utility: {} };
  });

  assert.deepEqual(imported, ['release-api.mjs', 'local-api.mjs']);
  assert.equal(module.fetchClient.ok, true);
});

test('does not probe stylesheet availability on localhost', async () => {
  let fetchCalls = 0;

  await runtime.initLadonStatic({
    baseUrl: new URL('http://127.0.0.1:4173/static/ladon-static.mjs'),
    api: { fetchClient: {}, utility: {} },
    document: undefined,
    fetch: () => {
      fetchCalls += 1;
      return { ok: true };
    },
  });

  assert.equal(fetchCalls, 0);
});

test('probes stylesheet availability outside localhost', async () => {
  let fetchCalls = 0;

  const ladon = await runtime.initLadonStatic({
    baseUrl: new URL('https://example.test/ui/draco/static/ladon-static.mjs'),
    api: { fetchClient: {}, utility: {} },
    document: undefined,
    fetch: () => {
      fetchCalls += 1;
      return { ok: true };
    },
  });

  assert.equal(fetchCalls, 1);
  assert.equal(ladon.cssHref, 'https://example.test/ui/draco/styles/global.css');
});

test('does not load webcomponents by default on localhost', async () => {
  let webComponentCalls = 0;

  await runtime.initLadonStatic({
    baseUrl: new URL('http://127.0.0.1:4173/static/ladon-static.mjs'),
    styles: false,
    api: {
      fetchClient: {},
      utility: {
        Initalizer: () => ({
          initWebComponents: async () => {
            webComponentCalls += 1;
          },
        }),
      },
    },
  });

  assert.equal(webComponentCalls, 0);
});

test('loads webcomponents by default outside localhost', async () => {
  let webComponentCalls = 0;

  await runtime.initLadonStatic({
    baseUrl: new URL('https://example.test/ui/draco/static/ladon-static.mjs'),
    styles: false,
    api: {
      fetchClient: {},
      utility: {
        Initalizer: () => ({
          initWebComponents: async () => {
            webComponentCalls += 1;
          },
        }),
      },
    },
  });

  assert.equal(webComponentCalls, 1);
});

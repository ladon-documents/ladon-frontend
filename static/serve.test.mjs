import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createStaticServer, getDevProxyTargets, getDevProxyTarget, resolveStaticRequestPath } from './serve.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('serves root requests from the default static test page', () => {
  assert.equal(resolveStaticRequestPath('/', repoRoot), path.join(repoRoot, 'static', 'test.html'));
});

test('serves repository files so static HTML can reach api and style dist assets', () => {
  assert.equal(
    resolveStaticRequestPath('/api/dist/ladon-api/ladon-api-static.mjs', repoRoot),
    path.join(repoRoot, 'api', 'dist', 'ladon-api', 'ladon-api-static.mjs'),
  );
});

test('rejects path traversal outside the repository', () => {
  assert.equal(resolveStaticRequestPath('/static/%2e%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd', repoRoot), undefined);
});

test('proxies Angular UI requests to the local UI dev server', () => {
  assert.equal(
    getDevProxyTarget('/ui/draco/ladon-core/login', { uiDevServer: 'http://127.0.0.1:4200' })?.href,
    'http://127.0.0.1:4200/ui/draco/ladon-core/login',
  );
});

test('uses IPv4 and IPv6 Angular dev server proxy targets by default', () => {
  assert.deepEqual(
    getDevProxyTargets('/ui/draco/ladon-core/login').map((target) => target.href),
    [
      'http://127.0.0.1:4200/ui/draco/ladon-core/login',
      'http://[::1]:4200/ui/draco/ladon-core/login',
      'http://localhost:4200/ui/draco/ladon-core/login',
    ],
  );
});

test('proxies backend requests through the Angular dev server in local auth flows', () => {
  assert.equal(
    getDevProxyTarget('/admin/auth/login', { uiDevServer: 'http://[::1]:4200' })?.href,
    'http://[::1]:4200/admin/auth/login',
  );
});

test('does not proxy static requests', () => {
  assert.equal(getDevProxyTarget('/static/authenticated.html'), undefined);
});

test('proxies POST request bodies to the next UI dev server target when the first target is unavailable', async () => {
  const upstream = http.createServer((request, response) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ method: request.method, url: request.url, body }));
    });
  });

  await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
  const upstreamPort = upstream.address().port;
  const staticServer = createStaticServer({
    repoRoot,
    uiDevServers: ['http://127.0.0.1:9', `http://127.0.0.1:${upstreamPort}`],
  });

  await new Promise((resolve) => staticServer.listen(0, '127.0.0.1', resolve));
  const staticPort = staticServer.address().port;

  try {
    const response = await fetch(`http://127.0.0.1:${staticPort}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"email":"x","password":"y"}',
    });
    const json = await response.json();

    assert.equal(response.status, 200);
    assert.equal(json.method, 'POST');
    assert.equal(json.url, '/admin/auth/login');
    assert.equal(json.body, '{"email":"x","password":"y"}');
  } finally {
    await new Promise((resolve) => staticServer.close(resolve));
    await new Promise((resolve) => upstream.close(resolve));
  }
});

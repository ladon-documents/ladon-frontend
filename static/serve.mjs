import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const DEFAULT_UI_DEV_SERVERS = ['http://127.0.0.1:4200', 'http://[::1]:4200', 'http://localhost:4200'];
const DEV_PROXY_PREFIXES = ['/ui/draco/ladon-core', '/admin', '/plugins'];

function normalizeDevServers(options = {}) {
  if (Array.isArray(options.uiDevServers) && options.uiDevServers.length > 0) {
    return options.uiDevServers;
  }

  if (options.uiDevServer) {
    return [options.uiDevServer];
  }

  return DEFAULT_UI_DEV_SERVERS;
}

export function getDevProxyTargets(requestUrl, options = {}) {
  const url = new URL(requestUrl, 'http://localhost');
  if (!DEV_PROXY_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    return [];
  }

  return normalizeDevServers(options).map((uiDevServer) => new URL(`${url.pathname}${url.search}`, uiDevServer));
}

export function getDevProxyTarget(requestUrl, options = {}) {
  return getDevProxyTargets(requestUrl, options)[0];
}

export function resolveStaticRequestPath(requestUrl, repoRoot) {
  if (/%2e/i.test(requestUrl)) {
    return undefined;
  }

  const url = new URL(requestUrl, 'http://localhost');
  const pathname = url.pathname === '/' ? '/static/test.html' : decodeURIComponent(url.pathname);
  const requestedPath = path.normalize(path.join(repoRoot, pathname));

  if (!requestedPath.startsWith(`${repoRoot}${path.sep}`) && requestedPath !== repoRoot) {
    return undefined;
  }

  return requestedPath;
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

function proxyRequestToTarget({ request, response, target, body }) {
  return new Promise((resolve, reject) => {
    const transport = target.protocol === 'https:' ? https : http;
    const headers = {
      ...request.headers,
      host: target.host,
    };

    if (body.length > 0) {
      headers['content-length'] = String(body.length);
    }

    const proxy = transport.request(
      target,
      {
        method: request.method,
        headers,
      },
      (proxyResponse) => {
        response.writeHead(proxyResponse.statusCode ?? 502, proxyResponse.headers);
        proxyResponse.pipe(response);
        resolve();
      },
    );

    proxy.on('error', reject);
    proxy.end(body);
  });
}

async function proxyRequest({ request, response, targets }) {
  let lastError;
  const body = await readRequestBody(request);

  for (const target of targets) {
    try {
      await proxyRequestToTarget({ request, response, target, body });
      return;
    } catch (error) {
      lastError = error;
    }
  }

  if (!response.headersSent) {
    response.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
  }
  response.end(`UI dev server proxy failed: ${lastError?.message ?? 'no target available'}`);
}

export function createStaticServer({ repoRoot, indexPath = '/static/test.html', uiDevServer, uiDevServers }) {
  return http.createServer((request, response) => {
    if (request.url === '/') {
      response.writeHead(302, { Location: indexPath });
      response.end();
      return;
    }

    const proxyTargets = getDevProxyTargets(request.url ?? '/', { uiDevServer, uiDevServers });
    if (proxyTargets.length > 0) {
      proxyRequest({ request, response, targets: proxyTargets }).catch((error) => {
        response.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end(`UI dev server proxy failed: ${error.message}`);
      });
      return;
    }

    const filePath = resolveStaticRequestPath(request.url ?? '/', repoRoot);
    if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    const extension = path.extname(filePath);
    response.writeHead(200, {
      'Content-Type': MIME_TYPES[extension] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(filePath).pipe(response);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const staticDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(staticDir, '..');
  const port = Number(process.env.PORT ?? process.argv[2] ?? 4173);
  const host = process.env.HOST ?? '127.0.0.1';
  const uiDevServers = process.env.UI_DEV_SERVER ? [process.env.UI_DEV_SERVER] : DEFAULT_UI_DEV_SERVERS;
  const server = createStaticServer({ repoRoot, uiDevServers });

  server.listen(port, host, () => {
    console.log(`Ladon static server running at http://${host}:${port}/static/test.html`);
    console.log(`Proxying ${DEV_PROXY_PREFIXES.join(', ')} to ${uiDevServers.join(', ')}`);
  });
}

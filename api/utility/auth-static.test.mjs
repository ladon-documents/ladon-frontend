import test from 'node:test';
import assert from 'node:assert/strict';

const api = await import('../dist/ladon-api/ladon-api-static.mjs');

test('static api exposes auth utilities', () => {
  assert.equal(typeof api.auth.getAccessToken, 'function');
  assert.equal(typeof api.auth.createAuthMiddleware, 'function');
  assert.equal(typeof api.auth.createAuthenticatedConfiguration, 'function');
});

test('auth middleware adds bearer token from Ladon auth storage', async () => {
  const storage = {
    getItem: (key) =>
      key === '@mind/ladon-auth-name'
        ? JSON.stringify({ accessToken: 'abc-123' })
        : null,
  };

  const middleware = api.auth.createAuthMiddleware({ storage });
  const request = await middleware.pre({
    url: '/admin/api/rest/v1/user/me',
    init: { headers: {} },
  });

  assert.equal(request.init.headers.Authorization, 'Bearer abc-123');
});

test('auth middleware does not add bearer token to login requests', async () => {
  const storage = {
    getItem: () => JSON.stringify({ accessToken: 'abc-123' }),
  };

  const middleware = api.auth.createAuthMiddleware({ storage });
  const request = await middleware.pre({
    url: '/admin/auth/login',
    init: { headers: {} },
  });

  assert.equal(request.init.headers.Authorization, undefined);
});

test('access token is read from browser session storage by default', () => {
  const originalSessionStorage = globalThis.sessionStorage;
  const originalLocalStorage = globalThis.localStorage;

  globalThis.sessionStorage = {
    getItem: (key) =>
      key === '@mind/ladon-auth-name'
        ? JSON.stringify({ accessToken: 'session-token' })
        : null,
  };
  globalThis.localStorage = {
    getItem: () => null,
  };

  try {
    assert.equal(api.auth.getAccessToken(), 'session-token');
  } finally {
    if (originalSessionStorage === undefined) {
      delete globalThis.sessionStorage;
    } else {
      globalThis.sessionStorage = originalSessionStorage;
    }

    if (originalLocalStorage === undefined) {
      delete globalThis.localStorage;
    } else {
      globalThis.localStorage = originalLocalStorage;
    }
  }
});

test('clears access token from browser session and local storage by default', () => {
  const removedKeys = [];
  const originalSessionStorage = globalThis.sessionStorage;
  const originalLocalStorage = globalThis.localStorage;

  globalThis.sessionStorage = {
    getItem: () => null,
    removeItem: (key) => removedKeys.push(`session:${key}`),
  };
  globalThis.localStorage = {
    getItem: () => null,
    removeItem: (key) => removedKeys.push(`local:${key}`),
  };

  try {
    api.auth.clearAccessToken();
  } finally {
    if (originalSessionStorage === undefined) {
      delete globalThis.sessionStorage;
    } else {
      globalThis.sessionStorage = originalSessionStorage;
    }

    if (originalLocalStorage === undefined) {
      delete globalThis.localStorage;
    } else {
      globalThis.localStorage = originalLocalStorage;
    }
  }

  assert.deepEqual(removedKeys, [
    'session:@mind/ladon-auth-name',
    'session:accessToken',
    'local:@mind/ladon-auth-name',
    'local:accessToken',
  ]);
});

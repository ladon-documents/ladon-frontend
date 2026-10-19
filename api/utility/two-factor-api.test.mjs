import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const api = await import('../dist/ladon-api/ladon-api-static.mjs');
const apiSpec = await readFile(new URL('../../spec/api.yaml', import.meta.url), 'utf8');

test('static api exposes two-factor authentication client and serializers', () => {
  assert.equal(typeof api.fetchClient.TwoFactorAuthenticationApi, 'function');
  assert.equal(typeof api.fetchClient.TwoFactorVerificationRequestToJSON, 'function');
  assert.equal(typeof api.fetchClient.TwoFactorConfirmResponseFromJSON, 'function');
});

test('login request serializer preserves the two-factor code', () => {
  assert.deepEqual(
    api.fetchClient.LoginRequestToJSON({
      email: 'admin@example.com',
      password: 'secret',
      twoFactorCode: '123456',
    }),
    {
      email: 'admin@example.com',
      password: 'secret',
      twoFactorCode: '123456',
    },
  );
});

test('login request serialization omits an absent two-factor code', () => {
  const serialized = JSON.stringify(
    api.fetchClient.LoginRequestToJSON({
      email: 'admin@example.com',
      password: 'secret',
    }),
  );

  assert.deepEqual(JSON.parse(serialized), {
    email: 'admin@example.com',
    password: 'secret',
  });
  assert.equal(serialized.includes('twoFactorCode'), false);
});

test('QR setup contract documents security-sensitive response headers', () => {
  const qrSetupContract = apiSpec
    .split('  /auth/2fa/confirm:')[0]
    .split('  /auth/2fa/setup/qr:')[1];

  assert.match(qrSetupContract, /description: PNG QR code for configuring two-factor authentication/);
  assert.match(qrSetupContract, /headers:\n\s+Cache-Control:/);
  assert.match(qrSetupContract, /\n\s+Pragma:/);
  assert.match(qrSetupContract, /\n\s+Content-Disposition:/);
  assert.match(qrSetupContract, /description: Authentication is required to set up two-factor authentication/);
});

test('setup requests a QR code with configured credentials and returns an image blob', async () => {
  const requests = [];
  const client = new api.fetchClient.TwoFactorAuthenticationApi(
    new api.fetchClient.Configuration({
      basePath: '/admin',
      credentials: 'include',
      fetchApi: async (url, init) => {
        requests.push({ url, init });
        return new Response(new Uint8Array([137, 80, 78, 71]), {
          status: 200,
          headers: { 'content-type': 'image/png' },
        });
      },
    }),
  );

  const qrCode = await client.setupTwoFactorQrCode();

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, '/admin/auth/2fa/setup/qr');
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(requests[0].init.credentials, 'include');
  assert.ok(qrCode instanceof Blob);
  assert.equal(qrCode.type, 'image/png');
});

test('confirmation posts the verification code and returns backup codes', async () => {
  const requests = [];
  const client = new api.fetchClient.TwoFactorAuthenticationApi(
    new api.fetchClient.Configuration({
      basePath: '/admin',
      fetchApi: async (url, init) => {
        requests.push({ url, init });
        return Response.json({
          success: true,
          backupCodes: ['backup-one', 'backup-two'],
        });
      },
    }),
  );

  const result = await client.confirmTwoFactorAuthentication({
    twoFactorVerificationRequest: { code: '123456' },
  });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, '/admin/auth/2fa/confirm');
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(requests[0].init.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(requests[0].init.body), { code: '123456' });
  assert.deepEqual(result.backupCodes, ['backup-one', 'backup-two']);
});

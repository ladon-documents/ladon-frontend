import test from 'node:test';
import assert from 'node:assert/strict';

const api = await import('../dist/ladon-api/ladon-api-static.mjs');

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
  assert.deepEqual(JSON.parse(requests[0].init.body), { code: '123456' });
  assert.deepEqual(result.backupCodes, ['backup-one', 'backup-two']);
});

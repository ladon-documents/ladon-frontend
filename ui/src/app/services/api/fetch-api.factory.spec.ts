import { TestBed } from '@angular/core/testing';
import { fetchClient } from '@ladon/api';

import { FetchApiFactory } from './fetch-api.factory';

describe('FetchApiFactory', () => {
  let factory: FetchApiFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    factory = TestBed.inject(FetchApiFactory);
  });

  it('provides the two-factor authentication api', () => {
    expect(factory.twoFactorAuthenticationApi).toBeInstanceOf(fetchClient.TwoFactorAuthenticationApi);
  });

  it('provides the filemanager api', () => {
    expect(factory.filemanagerApi).toBeInstanceOf(fetchClient.FilemanagerApi);
  });

  it('includes cookies in login requests and returns the typed auth response', async () => {
    const authResponse: fetchClient.AuthResponse = {
      accessToken: 'access-token',
      tokenType: 'Bearer',
      requiresTwoFactor: true,
    };
    const fetchSpy = spyOn(globalThis, 'fetch').and.resolveTo(
      new Response(JSON.stringify(authResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await factory.authControllerApi.authenticateUser({
      loginRequest: { email: 'user@example.com', password: 'password' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/admin/auth/login', jasmine.objectContaining({ credentials: 'include' }));
    expect(result).toEqual(authResponse);
  });

  it('normalizes generated response errors for RxJS consumers', (done) => {
    const response = new Response(JSON.stringify({ reason: 'Bucket nicht gefunden' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    factory
      .fromApi(() => Promise.reject(new fetchClient.ResponseError(response)))
      .subscribe({
        next: () => {
          fail('expected api request to fail');
        },
        error: (error) => {
          expect(error.status).toBe(404);
          expect(error.error.reason).toBe('Bucket nicht gefunden');
          done();
        },
      });
  });
});

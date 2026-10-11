import { TestBed } from '@angular/core/testing';
import { AuthResponse, fetchClient, LoginRequest, User } from '@ladon/api';
import { firstValueFrom, from } from 'rxjs';
import { FetchApiFactory } from './api/fetch-api.factory';
import { AuthService } from './auth.service';
import { AuthStorageService } from './auth.storage.service';

describe('AuthService', () => {
  let service: AuthService;
  let apiFactory: jasmine.SpyObj<FetchApiFactory>;
  let authControllerApi: jasmine.SpyObj<fetchClient.AuthControllerApi>;
  let userControllerApi: jasmine.SpyObj<fetchClient.UserControllerApi>;
  let authStorage: jasmine.SpyObj<AuthStorageService>;

  const loginRequest: LoginRequest = {
    email: 'user@example.com',
    password: 'password',
  };
  const authResponse: AuthResponse = {
    accessToken: 'token',
    tokenType: 'Bearer',
    requiresTwoFactor: false,
  };
  const twoFactorResponse: AuthResponse = {
    accessToken: '',
    tokenType: 'Bearer',
    requiresTwoFactor: true,
  };
  const user: User = {
    userId: 'user-id',
    fullName: 'Example User',
    email: 'user@example.com',
    roles: ['USER'],
    emailVerified: 'true',
    homeBucket: 'home-bucket',
  };

  beforeEach(() => {
    authControllerApi = jasmine.createSpyObj<fetchClient.AuthControllerApi>('AuthControllerApi', [
      'authenticateUser',
      'logout',
    ]);
    userControllerApi = jasmine.createSpyObj<fetchClient.UserControllerApi>('UserControllerApi', ['getCurrentUser']);
    apiFactory = jasmine.createSpyObj<FetchApiFactory>('FetchApiFactory', ['fromApi'], {
      authControllerApi,
      userControllerApi,
    });
    apiFactory.fromApi.and.callFake((request) => from(request()));
    authStorage = jasmine.createSpyObj<AuthStorageService>('AuthStorageService', ['setData', 'removeData']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: FetchApiFactory, useValue: apiFactory },
        { provide: AuthStorageService, useValue: authStorage },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('returns two-factor-required without storing an empty token or loading the user', async () => {
    authControllerApi.authenticateUser.and.resolveTo(twoFactorResponse);

    const result = await firstValueFrom(service.login(loginRequest));

    expect(result).toEqual({ kind: 'two-factor-required' });
    expect(authControllerApi.authenticateUser).toHaveBeenCalledWith({ loginRequest });
    expect(authStorage.setData).not.toHaveBeenCalled();
    expect(userControllerApi.getCurrentUser).not.toHaveBeenCalled();
  });

  it('stores the access token and token type before returning the authenticated user', async () => {
    const calls: string[] = [];
    authControllerApi.authenticateUser.and.resolveTo(authResponse);
    authStorage.setData.and.callFake(() => calls.push('store'));
    userControllerApi.getCurrentUser.and.callFake(async () => {
      calls.push('load');
      return user;
    });

    const result = await firstValueFrom(service.login(loginRequest));

    expect(authStorage.setData).toHaveBeenCalledWith({ accessToken: 'token', tokenType: 'Bearer' });
    expect(userControllerApi.getCurrentUser).toHaveBeenCalled();
    expect(calls).toEqual(['store', 'load']);
    expect(result).toEqual({ kind: 'authenticated', user });
  });

  it('rejects a completed login response without an access token', async () => {
    authControllerApi.authenticateUser.and.resolveTo({ ...authResponse, accessToken: '' });

    await expectAsync(firstValueFrom(service.login(loginRequest))).toBeRejectedWithError(
      'Login response did not include an access token',
    );
    expect(authStorage.setData).not.toHaveBeenCalled();
    expect(userControllerApi.getCurrentUser).not.toHaveBeenCalled();
  });

  it('clears structured and legacy tokens from browser storage without backend logout', () => {
    for (const storage of [sessionStorage, localStorage]) {
      storage.setItem('@mind/ladon-auth-name', JSON.stringify({ accessToken: 'stale-token' }));
      storage.setItem('accessToken', 'stale-token');
    }

    service.clearLocalSession();

    expect(authStorage.removeData).toHaveBeenCalled();
    expect(authControllerApi.logout).not.toHaveBeenCalled();
    for (const storage of [sessionStorage, localStorage]) {
      expect(storage.getItem('@mind/ladon-auth-name')).toBeNull();
      expect(storage.getItem('accessToken')).toBeNull();
    }
  });
});

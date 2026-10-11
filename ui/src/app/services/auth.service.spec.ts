import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { auth, AuthResponse, fetchClient, LoginRequest, User } from '@ladon/api';
import { defer, firstValueFrom, Subject } from 'rxjs';
import { FetchApiFactory } from './api/fetch-api.factory';
import { AuthService, LoginResult } from './auth.service';
import { AuthStorageService } from './auth.storage.service';

describe('AuthService', () => {
  let service: AuthService;
  let apiFactory: jasmine.SpyObj<FetchApiFactory>;
  let authControllerApi: jasmine.SpyObj<fetchClient.AuthControllerApi>;
  let userControllerApi: jasmine.SpyObj<fetchClient.UserControllerApi>;
  let authStorage: jasmine.SpyObj<AuthStorageService>;
  let storedAuthValues: Array<{
    storage: Storage;
    authData: string | null;
    legacyAccessToken: string | null;
  }>;

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
    apiFactory.fromApi.and.callFake((request) => defer(request));
    authStorage = jasmine.createSpyObj<AuthStorageService>('AuthStorageService', ['setData', 'removeData']);
    storedAuthValues = [sessionStorage, localStorage].map((storage) => ({
      storage,
      authData: storage.getItem(auth.LADON_AUTH_STORAGE_KEY),
      legacyAccessToken: storage.getItem(auth.LEGACY_ACCESS_TOKEN_KEY),
    }));

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
    for (const { storage, authData, legacyAccessToken } of storedAuthValues) {
      restoreStorageValue(storage, auth.LADON_AUTH_STORAGE_KEY, authData);
      restoreStorageValue(storage, auth.LEGACY_ACCESS_TOKEN_KEY, legacyAccessToken);
    }
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
    expect(authStorage.removeData).not.toHaveBeenCalled();
  });

  it('rejects a completed login response without an access token', async () => {
    authControllerApi.authenticateUser.and.resolveTo({ ...authResponse, accessToken: '' });

    await expectAsync(firstValueFrom(service.login(loginRequest))).toBeRejectedWithError(
      'Login response did not include valid credentials',
    );
    expect(authStorage.setData).not.toHaveBeenCalled();
    expect(userControllerApi.getCurrentUser).not.toHaveBeenCalled();
  });

  it('rejects a whitespace-only access token', async () => {
    authControllerApi.authenticateUser.and.resolveTo({ ...authResponse, accessToken: '   ' });

    await expectAsync(firstValueFrom(service.login(loginRequest))).toBeRejectedWithError(
      'Login response did not include valid credentials',
    );
    expect(authStorage.setData).not.toHaveBeenCalled();
    expect(userControllerApi.getCurrentUser).not.toHaveBeenCalled();
  });

  it('rejects a whitespace-only token type', async () => {
    authControllerApi.authenticateUser.and.resolveTo({ ...authResponse, tokenType: '   ' });

    await expectAsync(firstValueFrom(service.login(loginRequest))).toBeRejectedWithError(
      'Login response did not include valid credentials',
    );
    expect(authStorage.setData).not.toHaveBeenCalled();
    expect(userControllerApi.getCurrentUser).not.toHaveBeenCalled();
  });

  it('rejects a missing token type', async () => {
    const { tokenType: _tokenType, ...responseWithoutTokenType } = authResponse;
    authControllerApi.authenticateUser.and.resolveTo(responseWithoutTokenType as AuthResponse);

    await expectAsync(firstValueFrom(service.login(loginRequest))).toBeRejectedWithError(
      'Login response did not include valid credentials',
    );
    expect(authStorage.setData).not.toHaveBeenCalled();
    expect(userControllerApi.getCurrentUser).not.toHaveBeenCalled();
  });

  it('clears the local session and forwards the current-user error', async () => {
    const currentUserError = new Error('Could not load current user');
    authControllerApi.authenticateUser.and.resolveTo(authResponse);
    userControllerApi.getCurrentUser.and.rejectWith(currentUserError);
    seedStoredTokens();

    await expectAsync(firstValueFrom(service.login(loginRequest))).toBeRejectedWith(currentUserError);

    expect(authStorage.removeData).toHaveBeenCalledTimes(1);
    expectStoredTokensToBeRemoved();
  });

  it('clears the local session when no current user is returned', async () => {
    authControllerApi.authenticateUser.and.resolveTo(authResponse);
    userControllerApi.getCurrentUser.and.resolveTo(null as unknown as User);
    seedStoredTokens();

    await expectAsync(firstValueFrom(service.login(loginRequest))).toBeRejectedWithError('No user returned');

    expect(authStorage.removeData).toHaveBeenCalledTimes(1);
    expectStoredTokensToBeRemoved();
  });

  it('clears the local session when login is cancelled before the user is returned', fakeAsync(() => {
    const currentUser$ = new Subject<User>();
    authControllerApi.authenticateUser.and.resolveTo(authResponse);
    spyOn(service, 'getCurrentUser').and.returnValue(currentUser$);
    seedStoredTokens();

    const subscription = service.login(loginRequest).subscribe();
    flushMicrotasks();

    expect(authStorage.setData).toHaveBeenCalledWith({ accessToken: 'token', tokenType: 'Bearer' });
    subscription.unsubscribe();

    expect(authStorage.removeData).toHaveBeenCalledTimes(1);
    expectStoredTokensToBeRemoved();
  }));

  it('does not let a cancelled stale login clear a newer session', fakeAsync(() => {
    const firstCurrentUser$ = new Subject<User>();
    const secondCurrentUser$ = new Subject<User>();
    const secondResults: LoginResult[] = [];
    authControllerApi.authenticateUser.and.returnValues(
      Promise.resolve({ ...authResponse, accessToken: 'token-a' }),
      Promise.resolve({ ...authResponse, accessToken: 'token-b' }),
    );
    spyOn(service, 'getCurrentUser').and.returnValues(firstCurrentUser$, secondCurrentUser$);
    authStorage.setData.and.callFake(({ accessToken, tokenType }) => {
      for (const storage of [sessionStorage, localStorage]) {
        storage.setItem(auth.LADON_AUTH_STORAGE_KEY, JSON.stringify({ accessToken, tokenType }));
        storage.setItem(auth.LEGACY_ACCESS_TOKEN_KEY, accessToken);
      }
    });

    const firstSubscription = service.login(loginRequest).subscribe();
    flushMicrotasks();
    const secondSubscription = service.login(loginRequest).subscribe((result) => secondResults.push(result));
    flushMicrotasks();

    secondCurrentUser$.next(user);
    firstSubscription.unsubscribe();
    secondSubscription.unsubscribe();

    expect(secondResults).toEqual([{ kind: 'authenticated', user }]);
    expect(authStorage.removeData).not.toHaveBeenCalled();
    for (const storage of [sessionStorage, localStorage]) {
      expect(storage.getItem(auth.LADON_AUTH_STORAGE_KEY)).toBe(
        JSON.stringify({ accessToken: 'token-b', tokenType: 'Bearer' }),
      );
      expect(storage.getItem(auth.LEGACY_ACCESS_TOKEN_KEY)).toBe('token-b');
    }
  }));

  it('does not emit authenticated from a stale login', fakeAsync(() => {
    const firstCurrentUser$ = new Subject<User>();
    const secondCurrentUser$ = new Subject<User>();
    const firstResults: LoginResult[] = [];
    const secondResults: LoginResult[] = [];
    authControllerApi.authenticateUser.and.returnValues(
      Promise.resolve({ ...authResponse, accessToken: 'token-a' }),
      Promise.resolve({ ...authResponse, accessToken: 'token-b' }),
    );
    spyOn(service, 'getCurrentUser').and.returnValues(firstCurrentUser$, secondCurrentUser$);

    const firstSubscription = service.login(loginRequest).subscribe((result) => firstResults.push(result));
    flushMicrotasks();
    const secondSubscription = service.login(loginRequest).subscribe((result) => secondResults.push(result));
    flushMicrotasks();

    secondCurrentUser$.next(user);
    firstCurrentUser$.next(user);
    firstSubscription.unsubscribe();
    secondSubscription.unsubscribe();

    expect(secondResults).toEqual([{ kind: 'authenticated', user }]);
    expect(firstResults).toEqual([]);
    expect(authStorage.removeData).not.toHaveBeenCalled();
  }));

  it('clears structured and legacy tokens from browser storage without backend logout', () => {
    for (const storage of [sessionStorage, localStorage]) {
      storage.setItem(auth.LADON_AUTH_STORAGE_KEY, JSON.stringify({ accessToken: 'stale-token' }));
      storage.setItem(auth.LEGACY_ACCESS_TOKEN_KEY, 'stale-token');
    }

    service.clearLocalSession();

    expect(authStorage.removeData).toHaveBeenCalled();
    expect(authControllerApi.logout).not.toHaveBeenCalled();
    expectStoredTokensToBeRemoved();
  });

  function seedStoredTokens(): void {
    for (const storage of [sessionStorage, localStorage]) {
      storage.setItem(auth.LADON_AUTH_STORAGE_KEY, JSON.stringify({ accessToken: 'stale-token' }));
      storage.setItem(auth.LEGACY_ACCESS_TOKEN_KEY, 'stale-token');
    }
  }

  function expectStoredTokensToBeRemoved(): void {
    for (const storage of [sessionStorage, localStorage]) {
      expect(storage.getItem(auth.LADON_AUTH_STORAGE_KEY)).toBeNull();
      expect(storage.getItem(auth.LEGACY_ACCESS_TOKEN_KEY)).toBeNull();
    }
  }

  function restoreStorageValue(storage: Storage, key: string, value: string | null): void {
    if (value === null) {
      storage.removeItem(key);
      return;
    }

    storage.setItem(key, value);
  }
});

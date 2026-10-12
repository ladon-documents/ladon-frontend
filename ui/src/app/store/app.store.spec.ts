import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginRequest, User } from '@ladon/api';
import { Observable, Subject, of, throwError } from 'rxjs';
import { AuthService, LoginResult } from '../services/auth.service';
import type { FetchApiError } from '../services/api/fetch-api.factory';
import { environment } from '../../environments/environment';
import { AppStore } from './app.store';

describe('AppStore authentication flow', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const user: User = {
    userId: 'user-id',
    fullName: 'Example User',
    email: 'user@example.com',
    roles: ['USER'],
    emailVerified: 'true',
    homeBucket: 'home-bucket',
  };
  const loginRequest: LoginRequest = {
    email: 'user@example.com',
    password: 'super-secret-password',
  };

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'login',
      'logout',
      'getCurrentUser',
      'clearLocalSession',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('enters the two-factor step without authenticating, storing a user, or navigating', () => {
    const store = createStore();
    authService.login.and.returnValue(of({ kind: 'two-factor-required' }));

    store.login(loginRequest);

    expect(store.auth()).toEqual({
      isAuthenticated: false,
      user: null,
      loginError: null,
      isAuthenticating: false,
      redirectUrl: null,
      requiresTwoFactor: true,
    });
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('keeps the two-factor step and reports a stable error when a submitted code is rejected', () => {
    const store = createStore();
    authService.login.and.returnValue(of({ kind: 'two-factor-required' }));

    store.login({ ...loginRequest, twoFactorCode: '123456' });

    expect(store.auth()).toEqual({
      isAuthenticated: false,
      user: null,
      loginError: 'Zwei-Faktor-Code konnte nicht bestätigt werden. Bitte erneut versuchen.',
      isAuthenticating: false,
      redirectUrl: null,
      requiresTwoFactor: true,
    });
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('authenticates the user, clears the two-factor step, and uses the safe redirect resolver', () => {
    const store = createStore();
    const redirectUrl = `/${environment.baseHref}/documents`;
    store.setRedirectUrl(redirectUrl);
    authService.login.and.returnValues(of({ kind: 'two-factor-required' }), of({ kind: 'authenticated', user }));

    store.login(loginRequest);
    store.login({ ...loginRequest, twoFactorCode: '123456' });

    expect(store.auth.user()).toEqual(user);
    expect(store.auth.isAuthenticated()).toBeTrue();
    expect(store.auth.requiresTwoFactor()).toBeFalse();
    expect(store.auth.isAuthenticating()).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith(redirectUrl);
  });

  it('preserves the current step and uses a stable fallback for an unstructured login error', () => {
    const store = createStore();
    authService.login.and.returnValues(
      of({ kind: 'two-factor-required' }),
      throwError(() => new Error('password=super-secret-password&twoFactorCode=654321')),
    );

    store.login(loginRequest);
    store.login({ ...loginRequest, twoFactorCode: '654321' });

    expect(store.auth()).toEqual({
      isAuthenticated: false,
      user: null,
      loginError: 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.',
      isAuthenticating: false,
      redirectUrl: null,
      requiresTwoFactor: true,
    });
  });

  it('exposes only the approved message from a normalized FetchApiError', () => {
    const store = createStore();
    const apiError: FetchApiError = {
      status: 401,
      error: { reason: 'Anmeldedaten sind ungültig' },
      message: 'Anmeldedaten sind ungültig',
      body: { password: 'super-secret-password', twoFactorCode: '654321' },
      response: new Response(null, { status: 401 }),
      cause: {
        request: { ...loginRequest, twoFactorCode: '654321' },
      },
    };
    authService.login.and.returnValue(throwError(() => apiError));

    store.login(loginRequest);

    expect(store.auth()).toEqual({
      isAuthenticated: false,
      user: null,
      loginError: 'Anmeldedaten sind ungültig',
      isAuthenticating: false,
      redirectUrl: null,
      requiresTwoFactor: false,
    });
  });

  it('resets the transient login flow state', () => {
    const store = createStore();
    authService.login.and.returnValue(of({ kind: 'two-factor-required' }));
    store.login({ ...loginRequest, twoFactorCode: '123456' });

    store.resetLoginFlow();

    expect(store.auth.requiresTwoFactor()).toBeFalse();
    expect(store.auth.loginError()).toBeNull();
    expect(store.auth.isAuthenticating()).toBeFalse();
  });

  it('clears the local session, stores a safe redirect, resets auth, and navigates to login', () => {
    const store = createStore();
    const redirectUrl = `/${environment.baseHref}/documents/123`;
    authService.login.and.returnValue(of({ kind: 'authenticated', user }));
    store.login(loginRequest);
    router.navigateByUrl.calls.reset();

    store.requireReauthentication(redirectUrl);

    expect(authService.clearLocalSession).toHaveBeenCalledTimes(1);
    expect(store.auth()).toEqual({
      isAuthenticated: false,
      user: null,
      loginError: null,
      isAuthenticating: false,
      redirectUrl,
      requiresTwoFactor: false,
    });
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith(`${environment.baseHref}/login`);
  });

  it('normalizes an unsafe reauthentication redirect to the existing fallback', () => {
    const store = createStore();

    store.requireReauthentication(`https://attacker.example/${environment.baseHref}/steal`);

    expect(store.auth.redirectUrl()).toBe(`${environment.baseHref}/buckets`);
  });

  it('rejects ambiguous and encoded redirect URLs', () => {
    const store = createStore();
    const unsafeRedirects = [
      `//attacker.example/${environment.baseHref}/steal`,
      '/\\attacker.example/path',
      '/%2fattacker.example/path',
      '/%2Fattacker.example/path',
      '/%5cattacker.example/path',
      '/%255cattacker.example/path',
      `/${environment.baseHref}-evil/documents`,
    ];

    for (const redirectUrl of unsafeRedirects) {
      store.requireReauthentication(redirectUrl);
      expect(store.auth.redirectUrl()).withContext(redirectUrl).toBe(`${environment.baseHref}/buckets`);
    }
  });

  it('preserves canonical same-origin paths and internal base-href routes', () => {
    const store = createStore();
    const redirects = [
      {
        input: `/${environment.baseHref}/documents?tab=recent#selection`,
        expected: `/${environment.baseHref}/documents?tab=recent#selection`,
      },
      { input: `${environment.baseHref}/documents`, expected: `/${environment.baseHref}/documents` },
      { input: '/shared/documents?tab=recent', expected: '/shared/documents?tab=recent' },
      { input: `${window.location.origin}/shared/documents`, expected: '/shared/documents' },
      {
        input: `/${environment.baseHref}/documents?next=%2Fshared%5Cpath#return=%2Fhome%5Cfolder`,
        expected: `/${environment.baseHref}/documents?next=%2Fshared%5Cpath#return=%2Fhome%5Cfolder`,
      },
      {
        input: '/shared/documents?next=%5Cfolder#return=%2Fhome',
        expected: '/shared/documents?next=%5Cfolder#return=%2Fhome',
      },
    ];

    for (const { input, expected } of redirects) {
      store.requireReauthentication(input);
      expect(store.auth.redirectUrl()).withContext(input).toBe(expected);
    }
  });

  it('cancels a pending login when the login flow is reset', () => {
    const loginResult = new Subject<LoginResult>();
    const store = createStore();
    authService.login.and.returnValue(loginResult);
    store.login(loginRequest);
    expect(store.auth.isAuthenticating()).toBeTrue();

    store.resetLoginFlow();
    expect(loginResult.observed).toBeFalse();
    loginResult.next({ kind: 'authenticated', user });

    expect(store.auth.isAuthenticating()).toBeFalse();
    expect(store.auth.isAuthenticated()).toBeFalse();
    expect(store.auth.user()).toBeNull();
    expect(store.auth.requiresTwoFactor()).toBeFalse();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('cancels a pending login when reauthentication is required', () => {
    const loginResult = new Subject<LoginResult>();
    const store = createStore();
    authService.login.and.returnValue(loginResult);
    store.login(loginRequest);
    expect(store.auth.isAuthenticating()).toBeTrue();

    store.requireReauthentication(`/${environment.baseHref}/documents`);
    expect(loginResult.observed).toBeFalse();
    loginResult.next({ kind: 'two-factor-required' });

    expect(store.auth.isAuthenticating()).toBeFalse();
    expect(store.auth.isAuthenticated()).toBeFalse();
    expect(store.auth.user()).toBeNull();
    expect(store.auth.requiresTwoFactor()).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith(`${environment.baseHref}/login`);
  });

  it('cancels a pending login before logout', () => {
    const loginResult = new Subject<LoginResult>();
    const store = createStore();
    authService.login.and.returnValue(loginResult);
    authService.logout.and.returnValue(of({}));
    store.login(loginRequest);
    expect(store.auth.isAuthenticating()).toBeTrue();

    store.logout();
    expect(loginResult.observed).toBeFalse();
    loginResult.next({ kind: 'authenticated', user });

    expect(store.auth.isAuthenticating()).toBeFalse();
    expect(store.auth.isAuthenticated()).toBeFalse();
    expect(store.auth.user()).toBeNull();
    expect(store.auth.requiresTwoFactor()).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith(`${environment.baseHref}/login`);
  });

  it('clears the two-factor step on logout', () => {
    const store = createStore();
    authService.login.and.returnValue(of({ kind: 'two-factor-required' }));
    authService.logout.and.returnValue(of({}));
    store.login(loginRequest);

    store.logout();

    expect(store.auth.requiresTwoFactor()).toBeFalse();
  });

  it('clears local auth and navigates when backend logout fails', () => {
    const store = createStore();
    authService.login.and.returnValue(of({ kind: 'two-factor-required' }));
    authService.logout.and.returnValue(throwError(() => new Error('Backend unavailable')));
    store.login(loginRequest);

    store.logout();

    expect(authService.clearLocalSession).toHaveBeenCalledTimes(1);
    expect(store.auth()).toEqual({
      isAuthenticated: false,
      user: null,
      loginError: null,
      isAuthenticating: false,
      redirectUrl: null,
      requiresTwoFactor: false,
    });
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith(`${environment.baseHref}/login`);
  });

  it('cancels the pending initial user load when login starts', () => {
    const currentUser = new Subject<User>();
    const store = createStore(currentUser);
    authService.login.and.returnValue(of({ kind: 'two-factor-required' }));

    store.login(loginRequest);

    expect(currentUser.observed).toBeFalse();
    currentUser.next(user);

    expect(store.auth.isAuthenticated()).toBeFalse();
    expect(store.auth.user()).toBeNull();
    expect(store.auth.requiresTwoFactor()).toBeTrue();
    expect(store.auth.isAuthenticating()).toBeFalse();
  });

  it('cancels the pending initial user load before logout', () => {
    const currentUser = new Subject<User>();
    const store = createStore(currentUser);
    expect(store.auth.isAuthenticating()).toBeTrue();

    store.logout();
    expect(currentUser.observed).toBeFalse();
    currentUser.next(user);

    expect(store.auth()).toEqual({
      isAuthenticated: false,
      user: null,
      loginError: null,
      isAuthenticating: false,
      redirectUrl: null,
      requiresTwoFactor: false,
    });
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith(`${environment.baseHref}/login`);
  });

  it('cancels the pending initial user load before requiring reauthentication', () => {
    const currentUser = new Subject<User>();
    const store = createStore(currentUser);
    const redirectUrl = `/${environment.baseHref}/documents/123`;
    expect(store.auth.isAuthenticating()).toBeTrue();

    store.requireReauthentication(redirectUrl);
    expect(currentUser.observed).toBeFalse();
    currentUser.next(user);

    expect(store.auth()).toEqual({
      isAuthenticated: false,
      user: null,
      loginError: null,
      isAuthenticating: false,
      redirectUrl,
      requiresTwoFactor: false,
    });
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith(`${environment.baseHref}/login`);
  });

  function createStore(
    currentUser$: Observable<User> = throwError(() => new Error('Not authenticated')),
  ): InstanceType<typeof AppStore> {
    authService.getCurrentUser.and.returnValue(currentUser$);
    authService.logout.and.returnValue(of({}));
    authService.login.and.returnValue(throwError(() => new Error('Unexpected login call')) as Observable<LoginResult>);

    TestBed.configureTestingModule({
      providers: [AppStore, { provide: AuthService, useValue: authService }, { provide: Router, useValue: router }],
    });

    return TestBed.inject(AppStore);
  }
});

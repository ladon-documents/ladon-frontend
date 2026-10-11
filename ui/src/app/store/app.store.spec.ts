import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginRequest, User } from '@ladon/api';
import { Observable, Subject, of, throwError } from 'rxjs';
import { AuthService, LoginResult } from '../services/auth.service';
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
    authService.login.and.returnValues(
      of({ kind: 'two-factor-required' }),
      of({ kind: 'authenticated', user }),
    );

    store.login(loginRequest);
    store.login({ ...loginRequest, twoFactorCode: '123456' });

    expect(store.auth.user()).toEqual(user);
    expect(store.auth.isAuthenticated()).toBeTrue();
    expect(store.auth.requiresTwoFactor()).toBeFalse();
    expect(store.auth.isAuthenticating()).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith(redirectUrl);
  });

  it('preserves the current step after a login error and stores only the normalized error message', () => {
    const store = createStore();
    authService.login.and.returnValues(
      of({ kind: 'two-factor-required' }),
      throwError(() => new Error('Code ist ungültig')),
    );

    store.login(loginRequest);
    store.login({ ...loginRequest, twoFactorCode: '654321' });

    expect(store.auth()).toEqual({
      isAuthenticated: false,
      user: null,
      loginError: 'Code ist ungültig',
      isAuthenticating: false,
      redirectUrl: null,
      requiresTwoFactor: true,
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

  it('clears the two-factor step on logout', () => {
    const store = createStore();
    authService.login.and.returnValue(of({ kind: 'two-factor-required' }));
    authService.logout.and.returnValue(of({}));
    store.login(loginRequest);

    store.logout();

    expect(store.auth.requiresTwoFactor()).toBeFalse();
  });

  it('clears the two-factor step when loading the initial user fails', () => {
    const currentUser = new Subject<User>();
    const store = createStore(currentUser);
    authService.login.and.returnValue(of({ kind: 'two-factor-required' }));
    store.login(loginRequest);
    expect(store.auth.requiresTwoFactor()).toBeTrue();

    currentUser.error(new Error('Not authenticated'));

    expect(store.auth.requiresTwoFactor()).toBeFalse();
    expect(store.auth.isAuthenticating()).toBeFalse();
  });

  function createStore(
    currentUser$: Observable<User> = throwError(() => new Error('Not authenticated')),
  ): InstanceType<typeof AppStore> {
    authService.getCurrentUser.and.returnValue(currentUser$);
    authService.logout.and.returnValue(of({}));
    authService.login.and.returnValue(
      throwError(() => new Error('Unexpected login call')) as Observable<LoginResult>,
    );

    TestBed.configureTestingModule({
      providers: [
        AppStore,
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    return TestBed.inject(AppStore);
  }
});

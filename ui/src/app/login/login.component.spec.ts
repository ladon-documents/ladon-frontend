import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthResponse, fetchClient, LoginRequest, User } from '@ladon/api';
import { defer } from 'rxjs';
import { environment } from '../../environments/environment';
import { FetchApiFactory } from '../services/api/fetch-api.factory';
import { AuthService } from '../services/auth.service';
import { AuthStorageService } from '../services/auth.storage.service';
import { AppStore } from '../store/app.store';
import { LoginComponent } from './login.component';

interface AppStoreStub {
  readonly auth: {
    readonly requiresTwoFactor: WritableSignal<boolean>;
    readonly loginError: WritableSignal<string | null>;
    readonly isAuthenticating: WritableSignal<boolean>;
  };
  readonly login: jasmine.Spy<(request: LoginRequest) => void>;
  readonly resetLoginFlow: jasmine.Spy<() => void>;
  readonly setRedirectUrl: jasmine.Spy<(url: string) => void>;
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let store: AppStoreStub;

  beforeEach(async () => {
    const requiresTwoFactor = signal(false);
    store = {
      auth: {
        requiresTwoFactor,
        loginError: signal(null),
        isAuthenticating: signal(false),
      },
      login: jasmine.createSpy('login'),
      resetLoginFlow: jasmine.createSpy('resetLoginFlow').and.callFake(() => requiresTwoFactor.set(false)),
      setRedirectUrl: jasmine.createSpy('setRedirectUrl'),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AppStore, useValue: store },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (!fixture.componentRef.hostView.destroyed) {
      fixture.destroy();
    }
  });

  it('starts with credential controls and no two-factor code control or input', () => {
    expect(component.loginForm.controls.email).toBeDefined();
    expect(component.loginForm.controls.password).toBeDefined();
    expect(component.loginForm.controls.twoFactorCode).toBeUndefined();
    expect(fixture.nativeElement.querySelector('[formControlName="twoFactorCode"]')).toBeNull();
  });

  it('submits valid credentials without a two-factor code', () => {
    component.loginForm.controls.email.setValue('user@example.com');
    component.loginForm.controls.password.setValue('super-secret-password');

    submitForm();

    expect(store.login).toHaveBeenCalledOnceWith({
      email: 'user@example.com',
      password: 'super-secret-password',
    });
    expect(store.login.calls.mostRecent().args[0].twoFactorCode).toBeUndefined();
  });

  it('shows the instruction and configured code input when two-factor authentication is required', fakeAsync(() => {
    enterTwoFactorStep();

    const input = getTwoFactorInput();
    expect(fixture.nativeElement.textContent).toContain('Authentifizierungscode');
    expect(component.loginForm.controls.twoFactorCode).toBeDefined();
    expect(input.type).toBe('text');
    expect(input.inputMode).toBe('numeric');
    expect(input.autocomplete).toBe('one-time-code');
    expect(input.maxLength).toBe(6);
    expect(input.getAttribute('aria-label')).toBe('Zwei-Faktor-Code');
    expect(input.getAttribute('aria-describedby')).toBeNull();
    expect(fixture.nativeElement.querySelector('#two-factor-code-error')).toBeNull();
    expect((fixture.nativeElement.querySelector('#login-email') as HTMLInputElement).readOnly).toBeTrue();
    expect((fixture.nativeElement.querySelector('#login-password') as HTMLInputElement).readOnly).toBeTrue();
    expect(document.activeElement).toBe(input);
  }));

  it('does not reference an absent validation message for a touched valid code', fakeAsync(() => {
    enterTwoFactorStep();
    component.loginForm.controls.twoFactorCode?.setValue('123456');
    component.loginForm.controls.twoFactorCode?.markAsTouched();
    fixture.detectChanges();

    expect(getTwoFactorInput().getAttribute('aria-describedby')).toBeNull();
    expect(fixture.nativeElement.querySelector('#two-factor-code-error')).toBeNull();
  }));

  it('submits the unchanged credentials with an exactly six-digit code', fakeAsync(() => {
    component.loginForm.controls.email.setValue('user@example.com');
    component.loginForm.controls.password.setValue('super-secret-password');
    enterTwoFactorStep();
    component.loginForm.controls.twoFactorCode?.setValue('123456');

    submitForm();

    expect(store.login).toHaveBeenCalledOnceWith({
      email: 'user@example.com',
      password: 'super-secret-password',
      twoFactorCode: '123456',
    });
  }));

  it('creates a fresh request for each step and only includes the code in the second request', fakeAsync(() => {
    component.loginForm.controls.email.setValue('user@example.com');
    component.loginForm.controls.password.setValue('super-secret-password');
    submitForm();
    const credentialsRequest = store.login.calls.mostRecent().args[0];

    enterTwoFactorStep();
    component.loginForm.controls.twoFactorCode?.setValue('123456');
    submitForm();
    const twoFactorRequest = store.login.calls.mostRecent().args[0];

    expect(credentialsRequest).not.toBe(twoFactorRequest);
    expect(credentialsRequest.twoFactorCode).toBeUndefined();
    expect(twoFactorRequest).toEqual({
      email: 'user@example.com',
      password: 'super-secret-password',
      twoFactorCode: '123456',
    });
  }));

  it('shows authentication progress and prevents another submission while authenticating', () => {
    component.loginForm.controls.email.setValue('user@example.com');
    component.loginForm.controls.password.setValue('super-secret-password');
    store.auth.isAuthenticating.set(true);
    fixture.detectChanges();

    component.login();
    fixture.detectChanges();

    expect(store.login).not.toHaveBeenCalled();
    expect(getSubmitButton().disabled).toBeTrue();
    expect(getSubmitButton().querySelector('.loading-spinner')).not.toBeNull();
  });

  ['12345', '1234567', '12a456'].forEach((invalidCode) => {
    it(`prevents submission for the invalid code "${invalidCode}"`, fakeAsync(() => {
      component.loginForm.controls.email.setValue('user@example.com');
      component.loginForm.controls.password.setValue('super-secret-password');
      enterTwoFactorStep();
      component.loginForm.controls.twoFactorCode?.setValue(invalidCode);
      fixture.detectChanges();

      submitForm();

      expect(store.login).not.toHaveBeenCalled();
      expect(getSubmitButton().disabled).toBeTrue();
      expect(getTwoFactorInput().getAttribute('aria-invalid')).toBe('true');
      expect(getTwoFactorInput().getAttribute('aria-describedby')).toBe('two-factor-code-error');
      expect(fixture.nativeElement.querySelector('#two-factor-code-error')?.textContent).toContain(
        'exakt sechs Ziffern',
      );
    }));
  });

  it('clears and refocuses the code when the login error changes in the two-factor step', fakeAsync(() => {
    enterTwoFactorStep();
    component.loginForm.controls.twoFactorCode?.setValue('123456');
    const input = getTwoFactorInput();
    input.blur();

    store.auth.loginError.set('Der Code ist ungültig.');
    fixture.detectChanges();
    flushMicrotasks();

    expect(component.loginForm.controls.twoFactorCode?.value).toBe('');
    expect(document.activeElement).toBe(input);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('Der Code ist ungültig.');
  }));

  it('clears and refocuses the code when the same error occurs after a retry reset', fakeAsync(() => {
    enterTwoFactorStep();
    const input = getTwoFactorInput();
    const repeatedError = 'Der Code ist ungültig.';

    component.loginForm.controls.twoFactorCode?.setValue('123456');
    store.auth.loginError.set(repeatedError);
    fixture.detectChanges();
    flushMicrotasks();

    component.loginForm.controls.twoFactorCode?.setValue('654321');
    store.auth.loginError.set(null);
    fixture.detectChanges();
    input.blur();
    store.auth.loginError.set(repeatedError);
    fixture.detectChanges();
    flushMicrotasks();

    expect(component.loginForm.controls.twoFactorCode?.value).toBe('');
    expect(document.activeElement).toBe(input);
  }));

  it('returns to credentials by resetting the flow and clearing password and code', fakeAsync(() => {
    component.loginForm.controls.email.setValue('user@example.com');
    component.loginForm.controls.password.setValue('super-secret-password');
    enterTwoFactorStep();
    component.loginForm.controls.twoFactorCode?.setValue('123456');
    const twoFactorCode = component.loginForm.controls.twoFactorCode;

    component.backToCredentials();
    fixture.detectChanges();

    expect(store.resetLoginFlow).toHaveBeenCalledTimes(1);
    expect(component.loginForm.controls.email.value).toBe('user@example.com');
    expect(component.loginForm.controls.password.value).toBe('');
    expect(component.loginForm.controls.twoFactorCode).toBeUndefined();
    expect(twoFactorCode?.value).toBe('');
  }));

  it('clears credential secrets and resets the login flow on destroy', fakeAsync(() => {
    component.loginForm.controls.email.setValue('user@example.com');
    component.loginForm.controls.password.setValue('super-secret-password');
    enterTwoFactorStep();
    component.loginForm.controls.twoFactorCode?.setValue('123456');
    const twoFactorCode = component.loginForm.controls.twoFactorCode;

    fixture.destroy();

    expect(store.resetLoginFlow).toHaveBeenCalledTimes(1);
    expect(component.loginForm.controls.password.value).toBe('');
    expect(component.loginForm.controls.twoFactorCode).toBeUndefined();
    expect(twoFactorCode?.value).toBe('');
  }));

  function enterTwoFactorStep(): void {
    store.auth.requiresTwoFactor.set(true);
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  }

  function submitForm(): void {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  function getTwoFactorInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('#twoFactorInput') as HTMLInputElement;
  }

  function getSubmitButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
  }
});

describe('LoginComponent authentication lifecycle integration', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let store: InstanceType<typeof AppStore>;
  let apiFactory: jasmine.SpyObj<FetchApiFactory>;
  let authControllerApi: jasmine.SpyObj<fetchClient.AuthControllerApi>;
  let userControllerApi: jasmine.SpyObj<fetchClient.UserControllerApi>;
  let authStorage: jasmine.SpyObj<AuthStorageService>;
  let router: jasmine.SpyObj<Router>;

  const user: User = {
    userId: 'integration-user-id',
    fullName: 'Integration User',
    email: 'integration@example.com',
    roles: ['USER'],
    emailVerified: 'true',
    homeBucket: 'integration-home-bucket',
  };
  const twoFactorResponse: AuthResponse = {
    accessToken: '',
    tokenType: 'Bearer',
    requiresTwoFactor: true,
  };
  const authenticatedResponse: AuthResponse = {
    accessToken: 'integration-test-token',
    tokenType: 'Bearer',
    requiresTwoFactor: false,
  };

  beforeEach(async () => {
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
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    authControllerApi.authenticateUser.and.returnValues(
      Promise.resolve(twoFactorResponse),
      Promise.resolve(authenticatedResponse),
    );
    userControllerApi.getCurrentUser.and.returnValues(
      Promise.reject(new Error('Unauthenticated test session')),
      Promise.resolve(user),
    );

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        AppStore,
        AuthService,
        { provide: FetchApiFactory, useValue: apiFactory },
        { provide: AuthStorageService, useValue: authStorage },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(AppStore);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (!fixture.componentRef.hostView.destroyed) {
      fixture.destroy();
    }
  });

  it('preserves the authenticated session when the successful login component is destroyed', fakeAsync(() => {
    flushMicrotasks();
    expect(store.auth.isAuthenticated()).toBeFalse();
    expect(store.auth.isAuthenticating()).toBeFalse();
    expect(userControllerApi.getCurrentUser).toHaveBeenCalledTimes(1);

    component.loginForm.controls.email.setValue('integration@example.com');
    component.loginForm.controls.password.setValue('integration-test-password');
    component.login();
    flushMicrotasks();
    fixture.detectChanges();
    flushMicrotasks();

    expect(store.auth.requiresTwoFactor()).toBeTrue();
    expect(authControllerApi.authenticateUser).toHaveBeenCalledOnceWith({
      loginRequest: {
        email: 'integration@example.com',
        password: 'integration-test-password',
      },
    });
    component.loginForm.controls.twoFactorCode?.setValue('123456');
    component.login();
    flushMicrotasks();
    fixture.detectChanges();

    expect(store.auth.isAuthenticated()).toBeTrue();
    expect(store.auth.user()).toEqual(user);
    expect(authControllerApi.authenticateUser.calls.mostRecent().args[0]).toEqual({
      loginRequest: {
        email: 'integration@example.com',
        password: 'integration-test-password',
        twoFactorCode: '123456',
      },
    });
    expect(userControllerApi.getCurrentUser).toHaveBeenCalledTimes(2);
    expect(authStorage.setData).toHaveBeenCalledOnceWith({
      accessToken: 'integration-test-token',
      tokenType: 'Bearer',
    });
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith(`${environment.baseHref}/buckets`);

    fixture.destroy();

    expect(store.auth.isAuthenticated()).toBeTrue();
    expect(store.auth.user()).toEqual(user);
    expect(authStorage.removeData).not.toHaveBeenCalled();
  }));
});

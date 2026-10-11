import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoginRequest } from '@ladon/api';
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
    expect(input.getAttribute('aria-describedby')).toBe('two-factor-code-error');
    expect((fixture.nativeElement.querySelector('#login-email') as HTMLInputElement).readOnly).toBeTrue();
    expect((fixture.nativeElement.querySelector('#login-password') as HTMLInputElement).readOnly).toBeTrue();
    expect(document.activeElement).toBe(input);
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

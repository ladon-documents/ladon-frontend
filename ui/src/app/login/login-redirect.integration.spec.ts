import { Component, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { LoginRequest, User } from '@ladon/api';
import { Subject, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService, LoginResult } from '../services/auth.service';
import { AuthGuard } from '../shared/guards/auth/auth.guard';
import { CanActivateLogin } from '../shared/guards/auth/can-activate.login';
import { AppStore } from '../store/app.store';
import { LoginComponent } from './login.component';

@Component({ standalone: true, template: '<p>Application</p>' })
class ApplicationStubComponent {}

@Component({
  standalone: true,
  imports: [RouterOutlet],
  template: `
    @if (store.auth.isAuthenticating()) {
      <p data-layout="loading">Loading</p>
    }
    @if (store.auth.isAuthenticated()) {
      <div data-layout="authenticated"><router-outlet /></div>
    } @else {
      <div data-layout="anonymous"><router-outlet /></div>
    }
  `,
})
class AuthLayoutHarnessComponent {
  readonly store = inject(AppStore);
}

describe('direct login redirect integration', () => {
  let fixture: ComponentFixture<AuthLayoutHarnessComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let loginResult: Subject<LoginResult>;
  let router: Router;

  const user: User = {
    userId: 'user-id',
    fullName: 'Example User',
    email: 'user@example.com',
    roles: ['USER'],
    emailVerified: 'true',
    homeBucket: 'home-bucket',
  };

  beforeEach(async () => {
    loginResult = new Subject<LoginResult>();
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'login',
      'logout',
      'getCurrentUser',
      'clearLocalSession',
    ]);
    authService.getCurrentUser.and.returnValue(throwError(() => new Error('No initial session')));
    authService.login.and.returnValue(loginResult);

    await TestBed.configureTestingModule({
      imports: [AuthLayoutHarnessComponent],
      providers: [
        AppStore,
        CanActivateLogin,
        AuthGuard,
        { provide: AuthService, useValue: authService },
        provideRouter([
          {
            path: `${environment.baseHref}/login`,
            component: LoginComponent,
            canActivate: [CanActivateLogin],
          },
          {
            path: `${environment.baseHref}/buckets`,
            component: ApplicationStubComponent,
            canActivate: [AuthGuard],
          },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthLayoutHarnessComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
    await router.navigateByUrl(`/${environment.baseHref}/login`);
    fixture.detectChanges();
  });

  it('keeps the login subscription alive while authentication is pending and then enters the application', async () => {
    setInputValue('#login-email', 'user@example.com');
    setInputValue('#login-password', 'super-secret-password');

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(authService.login).toHaveBeenCalledOnceWith({
      email: 'user@example.com',
      password: 'super-secret-password',
    } satisfies LoginRequest);
    expect(loginResult.observed).toBeTrue();

    loginResult.next({ kind: 'authenticated', user });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe(`/${environment.baseHref}/buckets`);
    expect(fixture.nativeElement.textContent).toContain('Application');
  });

  function setInputValue(selector: string, value: string): void {
    const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }
});

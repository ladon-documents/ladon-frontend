import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AppStore } from '../../../store/app.store';
import { CanActivateLogin } from './can-activate.login';

describe('CanActivateLogin', () => {
  const isAuthenticated = signal(false);
  const isAuthenticating = signal(false);
  const user = signal<object | null>(null);
  const redirectUrl = signal<string | null>(null);

  let guard: CanActivateLogin;
  let router: Router;

  beforeEach(() => {
    isAuthenticated.set(false);
    isAuthenticating.set(false);
    user.set(null);
    redirectUrl.set(null);

    TestBed.configureTestingModule({
      providers: [
        CanActivateLogin,
        provideRouter([]),
        {
          provide: AppStore,
          useValue: {
            auth: { isAuthenticated, isAuthenticating, user, redirectUrl },
          },
        },
      ],
    });

    guard = TestBed.inject(CanActivateLogin);
    router = TestBed.inject(Router);
  });

  it('allows an unauthenticated user to open the login route', async () => {
    const result = await executeGuard();

    expect(result).toBeTrue();
  });

  it('returns the application fallback when an authenticated direct login has no redirect URL', async () => {
    isAuthenticated.set(true);
    user.set({ userId: 'user-id' });

    const result = await executeGuard();

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe(`/${environment.baseHref}/buckets`);
  });

  function executeGuard(): Promise<boolean | UrlTree> {
    return firstValueFrom(
      guard.canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot) as Observable<boolean | UrlTree>,
    );
  }
});

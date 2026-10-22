import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { lastValueFrom, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthGuard } from './auth.guard';
import { AppStore } from '../../../store/app.store';
import { AuthService } from '../../../services/auth.service';

describe('AuthGuard', () => {
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree']);
    // AppStore is the real store: its onInit triggers loadCurrentUser() →
    // authService.getCurrentUser(). The guard only reads store.auth.user(), so
    // AuthService is an inert stub whose getCurrentUser completes unauthenticated
    // (user null) — the store's auth.user() therefore stays null and the redirect
    // branch under test fires. A method-less `createSpyObj` throws, and a bare {}
    // stub throws inside the store's stream, so we stub the real method instead.
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getCurrentUser',
      'login',
      'logout',
      'clearLocalSession',
    ]);
    authServiceSpy.getCurrentUser.and.returnValue(of(null));
    TestBed.configureTestingModule({
      providers: [
        AppStore,
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  it('should be created', () => {
    expect(TestBed.inject(AuthGuard)).toBeTruthy();
  });

  it('redirects to login with the redirectUrl query param when the user is unauthenticated', async () => {
    const guard = TestBed.inject(AuthGuard);
    const next = {} as ActivatedRouteSnapshot;
    const state = { url: '/some/feature' } as RouterStateSnapshot;

    const result = await lastValueFrom(guard.canActivate(next, state));

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalled();
    const [path, options] = routerSpy.navigate.calls.mostRecent().args;
    expect(path).toContain(`${environment.baseHref}/login`);
    expect(options).toEqual({ queryParams: { redirectUrl: '/some/feature' } });
  });
});

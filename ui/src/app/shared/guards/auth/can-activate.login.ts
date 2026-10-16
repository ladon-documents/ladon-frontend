import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AppStore } from '../../../store/app.store';
import { computed, inject, Injectable } from '@angular/core';
import { filter, Observable, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CanActivateLogin implements CanActivate {
  readonly #store = inject(AppStore);
  readonly #router = inject(Router);
  readonly #authStatus = computed(() => ({
    isAuthenticated: this.#store.auth.isAuthenticated(),
    isAuthenticating: this.#store.auth.isAuthenticating(),
    user: this.#store.auth.user(),
    redirectUrl: this.#store.auth.redirectUrl(),
  }));

  readonly #sub$ = toObservable(this.#authStatus);

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.#sub$.pipe(
      filter((status) => !status.isAuthenticating),
      take(1),
      map((status) => {
        const canActivate = !(status.isAuthenticated || status.user);
        if (!canActivate) {
          const redirectUrl = status.redirectUrl || `${environment.baseHref}/buckets`;
          return this.#router.parseUrl(redirectUrl.startsWith('/') ? redirectUrl : `/${redirectUrl}`);
        }
        return true;
      }),
    );
  }
}

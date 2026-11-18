import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AppStore } from '../../../store/app.store';
import { inject, Injectable } from '@angular/core';
import { defer, filter, map, Observable, of, take } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CanActivateLogin implements CanActivate {
  readonly #store = inject(AppStore);
  readonly #router = inject(Router);
  readonly #isAuthenticating$ = toObservable(this.#store.auth.isAuthenticating);

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return defer(() => {
      if (!this.#store.auth.isAuthenticating()) {
        return of(this.#resolveAccess());
      }

      return this.#isAuthenticating$.pipe(
        filter((isAuthenticating) => !isAuthenticating),
        take(1),
        map(() => this.#resolveAccess()),
      );
    });
  }

  #resolveAccess(): boolean | UrlTree {
    if (!(this.#store.auth.isAuthenticated() || this.#store.auth.user())) {
      return true;
    }

    const redirectUrl = this.#store.auth.redirectUrl() || `${environment.baseHref}/buckets`;
    return this.#router.parseUrl(redirectUrl.startsWith('/') ? redirectUrl : `/${redirectUrl}`);
  }
}

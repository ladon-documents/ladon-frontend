import { computed, inject, Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AppStore } from '../../../store/app.store';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  readonly #store = inject(AppStore);
  constructor(private router: Router) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const currentUser = this.#store.auth.user;
    if (currentUser()) {
      return of(true);
    }
    this.router.navigateByUrl(`${environment.baseHref}/login`);
    return of(false);
  }
}

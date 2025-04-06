import { computed, Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const currentUser = computed(() => this.authService.currentUser());
    if (currentUser() !== undefined) {
      return of(true);
    }
    this.router.navigateByUrl(`${environment.baseHref}/login`);
    return of(false);
    /*
    return this.authService.user$.pipe(
      map((user) => {
        if (user) {
          return true;
        } else {
          this.router.navigateByUrl(`${environment.baseHref}/login`);
          return false;
        }
      }),
    );
    
     */
  }
}

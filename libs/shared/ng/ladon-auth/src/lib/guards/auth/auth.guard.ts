import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { map } from 'rxjs/operators';
import {environment} from "@ladon/environment";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(
      next: ActivatedRouteSnapshot,
      state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.user$.pipe(
        map(user => {
          if (user) {
            return true;
          } else {
            this.router.navigateByUrl(`${environment.baseHref}/login`);
            return false;
          }
        })
    );
  }
}

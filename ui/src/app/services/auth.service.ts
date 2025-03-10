import { Injectable, isDevMode } from '@angular/core';
import { BehaviorSubject, mergeMap, of, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthenticationService, LoginRequestModel, UserModel, UsersService } from '../../api';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authConfig = {
    filter: 'etc/ui/mind/mf-ladon-auth-api/config/auth.json',
    prefix: 'etc/',
    bucket: '_system',
  };
  private userSubject$ = new BehaviorSubject<any>(null);
  private readonly devUser: UserModel = {
    userId: 'admin',
    fullName: 'Armin Strator',
    email: 'info@mind-consulting.de',
    roles: ['admin', 'user'],
    imageUrl: undefined,
    provider: 'ladon',
    emailVerified: 'true',
    homeBucket: 'admin',
  };
  user$ = this.userSubject$.asObservable();

  constructor(
    private as: AuthenticationService,
    private us: UsersService,
  ) {
    //  this.getCurrentUser();
  }

  public login(Login: LoginRequestModel) {
    if (this.isDevelopmentEnironment()) {
      this.userSubject$.next(this.devUser);
      return of(this.devUser);
    }
    return this.as.authenticateUser(Login).pipe(
      mergeMap((res) => {
        return this.us.getCurrentUser();
      }),
      map((user: UserModel) => {
        this.userSubject$.next(user);
        return user;
      }),
    );
  }

  public logout() {
    this.as.logout().subscribe((response) => {
      console.log(response);
    });
  }

  public getCurrentUser() {
    return this.us.getCurrentUser().pipe(
      tap((user: UserModel) => {
        this.userSubject$.next(user);
      }),
    );
  }

  private isDevelopmentEnironment(): boolean {
    return isDevMode();
  }
}

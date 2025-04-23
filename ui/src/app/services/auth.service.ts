import { Injectable, isDevMode, signal, WritableSignal } from '@angular/core';
import { BehaviorSubject, mergeMap, of, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthenticationService, LoginRequestModel, UserModel, UsersService } from '../../api';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
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
  private userSignal$: WritableSignal<UserModel | undefined> = signal<UserModel | undefined>(undefined);

  constructor(
    private as: AuthenticationService,
    private us: UsersService,
  ) {
     this.getCurrentUser();
  }

  get currentUser() {
    return this.userSignal$.asReadonly();
  }

  public async initLadonAuthentication(loginRequest: any): Promise<any> {
    const path =
        this.as.configuration.basePath  +'/auth/login';
    const opts = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginRequest),
    };

    const response = await fetch(path, opts);

    if (response.ok) {
      return response.json();
    }

    throw response;
  }
  public login(Login: LoginRequestModel) {
    if (this.isDevelopmentEnironment()) {
      this.userSignal$.set(this.devUser);
      return of(this.devUser);
    }

    return this.as.authenticateUser(Login).pipe(
      map((response) => {
        const tokenResponse = response as {
          accessToken: string;
          tokenType: string;
        };
        localStorage.setItem('accessToken', tokenResponse.accessToken);
        return response;
      }),
      mergeMap((res: any) => {
        return this.us.getCurrentUser();
      }),
      map((user: UserModel) => {
        this.userSignal$.set(user);
        return user;
      }),
    );
  }

  public logout() {
    return this.as.logout().subscribe((response) => {
      localStorage.removeItem('accessToken');
      this.userSignal$.set(undefined);
    });
  }

  public getCurrentUser() {
    return this.us.getCurrentUser().pipe(
      tap((user: UserModel) => {
        this.userSignal$.set(user);
      }),
    );
  }

  private isDevelopmentEnironment(): boolean {
    return isDevMode();
  }
}

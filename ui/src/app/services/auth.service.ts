import { Injectable, isDevMode } from '@angular/core';
import { mergeMap, tap } from 'rxjs';
import { LoginRequest, User } from '@ladon/api';
import { AuthStorageService } from './auth.storage.service';
import { FetchApiFactory } from './api/fetch-api.factory';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private expiryTimer: number | undefined;

  constructor(
    private apiFactory: FetchApiFactory,
    private authStorage: AuthStorageService,
    private router: Router,
  ) {
    this.onVisibilityChangeWatcher();
  }

  public login(Login: LoginRequest) {
    return this.apiFactory
      .fromApi(() => this.apiFactory.authControllerApi.authenticateUser({ loginRequest: Login as any }))
      .pipe(
        tap((response: any) => {
          if (response?.accessToken) {
            this.authStorage.setData({ accessToken: response.accessToken });
          }
        }),
        mergeMap(() => {
          return this.apiFactory.fromApi(() => this.apiFactory.userControllerApi.getCurrentUser() as Promise<User>);
        }),
        tap((user: User) => {
          if (!user) {
            throw new Error('Could not load user after login');
          }
        }),
      );
  }

  public logout() {
    return this.apiFactory
      .fromApi(() => this.apiFactory.authControllerApi.logout())
      .pipe(
        tap(() => {
          this.authStorage.removeData();
        }),
      );
  }

  public async sessionExpired() {
    this.authStorage.removeData();
    await this.router.navigate([`${environment.baseHref}/login`]);
  }

  public getCurrentUser() {
    return this.apiFactory
      .fromApi(() => this.apiFactory.userControllerApi.getCurrentUser() as Promise<User>)
      .pipe(
        tap((user) => {
          if (!user) {
            throw new Error('No user returned');
          }
        }),
      );
  }

  private onVisibilityChangeWatcher() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.fetchTokenTtlAndScheduleLogout();
      }
    });
  }

  private fetchTokenTtlAndScheduleLogout() {
  }


    private scheduleLogoutOnTimer(remainingMillis: number) {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
    }
    this.expiryTimer = setTimeout(async () => {
      await this.sessionExpired();
    }, remainingMillis);
  }


  private isDevelopmentEnironment(): boolean {
    return isDevMode();
  }
}

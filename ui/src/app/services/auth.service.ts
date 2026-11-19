import { Injectable } from '@angular/core';
import { catchError, defer, EMPTY, finalize, mergeMap, Observable, of, tap, throwError } from 'rxjs';
import { auth, LoginRequest, User } from '@ladon/api';
import { AuthStorageService } from './auth.storage.service';
import { FetchApiFactory } from './api/fetch-api.factory';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export type LoginResult = { kind: 'two-factor-required' } | { kind: 'authenticated'; user: User };

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private expiryTimer: number | undefined;
  private currentLoginOwner: symbol | null = null;

  constructor(
    private apiFactory: FetchApiFactory,
    private authStorage: AuthStorageService,
    private router: Router,
  ) {
    this.onVisibilityChangeWatcher();
  }

  public login(request: LoginRequest): Observable<LoginResult> {
    return defer(() => {
      const owner = Symbol('login-owner');
      let credentialsStored = false;
      let authenticated = false;
      let sessionCleared = false;
      const clearIncompleteSession = () => {
        if (sessionCleared || this.currentLoginOwner !== owner) {
          return;
        }

        sessionCleared = true;
        this.clearLocalSession();
      };

      return this.apiFactory
        .fromApi(() => this.apiFactory.authControllerApi.authenticateUser({ loginRequest: request }))
        .pipe(
          mergeMap((response) => {
            const accessToken = response.accessToken?.trim();
            const tokenType = response.tokenType?.trim();
            if (!accessToken || !tokenType) {
              if (response.requiresTwoFactor) {
                return of<LoginResult>({ kind: 'two-factor-required' });
              }

              return throwError(() => new Error('Login response did not include valid credentials'));
            }

            this.authStorage.setData({ accessToken, tokenType });
            this.currentLoginOwner = owner;
            credentialsStored = true;
            return this.getCurrentUser().pipe(
              mergeMap((user) => {
                if (this.currentLoginOwner !== owner) {
                  return EMPTY;
                }

                authenticated = true;
                return of({ kind: 'authenticated', user } satisfies LoginResult);
              }),
              catchError((error: unknown) => {
                if (this.currentLoginOwner !== owner) {
                  return EMPTY;
                }

                clearIncompleteSession();
                return throwError(() => error);
              }),
            );
          }),
          finalize(() => {
            if (credentialsStored && !authenticated) {
              clearIncompleteSession();
            }
          }),
        );
    });
  }

  public clearLocalSession(): void {
    this.currentLoginOwner = null;
    this.authStorage.removeData();
    auth.clearAccessToken();
  }

  public logout() {
    return this.apiFactory.fromApi(() => this.apiFactory.authControllerApi.logout());
  }

  public async sessionExpired() {
    this.authStorage.removeData();
    await this.router.navigate([`${environment.baseHref}/login`]);
  }

  public getCurrentUser() {
    return this.apiFactory
      .fromApi(() => this.apiFactory.userControllerApi.getCurrentUser())
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
}

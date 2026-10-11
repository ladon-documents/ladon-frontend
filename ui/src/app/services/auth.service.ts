import { Injectable } from '@angular/core';
import { catchError, defer, finalize, map, mergeMap, Observable, of, tap, throwError } from 'rxjs';
import { auth, LoginRequest, User } from '@ladon/api';
import { AuthStorageService } from './auth.storage.service';
import { FetchApiFactory } from './api/fetch-api.factory';

export type LoginResult =
  | { kind: 'two-factor-required' }
  | { kind: 'authenticated'; user: User };

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private apiFactory: FetchApiFactory,
    private authStorage: AuthStorageService,
  ) {}

  public login(request: LoginRequest): Observable<LoginResult> {
    return defer(() => {
      let credentialsStored = false;
      let authenticated = false;
      let sessionCleared = false;
      const clearIncompleteSession = () => {
        if (!sessionCleared) {
          this.clearLocalSession();
          sessionCleared = true;
        }
      };

      return this.apiFactory
        .fromApi(() => this.apiFactory.authControllerApi.authenticateUser({ loginRequest: request }))
        .pipe(
          mergeMap((response) => {
            if (response.requiresTwoFactor) {
              return of<LoginResult>({ kind: 'two-factor-required' });
            }

            const accessToken = response.accessToken?.trim();
            const tokenType = response.tokenType?.trim();
            if (!accessToken || !tokenType) {
              return throwError(() => new Error('Login response did not include valid credentials'));
            }

            this.authStorage.setData({ accessToken, tokenType });
            credentialsStored = true;
            return this.getCurrentUser().pipe(
              map((user) => {
                authenticated = true;
                return { kind: 'authenticated', user } satisfies LoginResult;
              }),
              catchError((error: unknown) => {
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
    this.authStorage.removeData();
    auth.clearAccessToken();
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
}

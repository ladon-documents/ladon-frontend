import { Injectable } from '@angular/core';
import { map, mergeMap, Observable, of, tap, throwError } from 'rxjs';
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
    return this.apiFactory
      .fromApi(() => this.apiFactory.authControllerApi.authenticateUser({ loginRequest: request }))
      .pipe(
        mergeMap((response) => {
          if (response.requiresTwoFactor) {
            return of<LoginResult>({ kind: 'two-factor-required' });
          }

          if (!response.accessToken) {
            return throwError(() => new Error('Login response did not include an access token'));
          }

          this.authStorage.setData({ accessToken: response.accessToken, tokenType: response.tokenType });
          return this.getCurrentUser().pipe(
            map((user) => ({ kind: 'authenticated', user }) satisfies LoginResult),
          );
        }),
      );
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

import { Injectable, isDevMode } from '@angular/core';
import { mergeMap, tap } from 'rxjs';
import { LoginRequest, User } from '@ladon/api';
import { AuthStorageService } from './auth.storage.service';
import { FetchApiFactory } from './api/fetch-api.factory';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private apiFactory: FetchApiFactory,
    private authStorage: AuthStorageService,
  ) {}

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

  private isDevelopmentEnironment(): boolean {
    return isDevMode();
  }
}

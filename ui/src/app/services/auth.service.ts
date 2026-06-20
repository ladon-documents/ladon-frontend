import { Injectable, isDevMode } from '@angular/core';
import { mergeMap, tap } from 'rxjs';
import { LoginRequestModel, UserModel } from '@ladon/api';
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

  public login(Login: LoginRequestModel) {
    return this.apiFactory
      .fromApi(() => this.apiFactory.authControllerApi.authenticateUser({ loginRequest: Login as any }))
      .pipe(
        tap((response: any) => {
          if (response?.accessToken) {
            this.authStorage.setData({ accessToken: response.accessToken });
          }
        }),
        mergeMap(() => {
          return this.apiFactory.fromApi(
            () => this.apiFactory.userControllerApi.getCurrentUser() as Promise<UserModel>,
          );
        }),
        tap((user: UserModel) => {
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
      .fromApi(() => this.apiFactory.userControllerApi.getCurrentUser() as Promise<UserModel>)
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

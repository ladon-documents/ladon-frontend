import { Inject, Injectable, isDevMode } from '@angular/core';
import { mergeMap, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import {  AuthControllerService, LoginRequestModel, UserModel, UserControllerService} from '../../api';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthStorageService } from './auth.storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private as: AuthControllerService,
    private us: UserControllerService,
    private httpClient: HttpClient,
    private authStorage: AuthStorageService,
  ) {}

  public login(Login: LoginRequestModel) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json;  charset=utf-8');
    const httpOptions = {
      headers,
      responseType: 'json' as 'json',
    };
    return this.httpClient
      .post<{
        accessToken: string;
        tokenType: string;
      }>(this.as.configuration.basePath + '/auth/login', JSON.stringify(Login), httpOptions)
      .pipe(
        map((response) => {
          const tokenResponse = response;
          this.authStorage.setData({ accessToken: tokenResponse.accessToken });
          return response;
        }),
        mergeMap((res: any) => {
          return this.us.getCurrentUser();
        }),
        map((user: UserModel) => {
          return user;
        }),
      );
  }

  public logout() {
    return this.as.logout().pipe(
      tap(() => {
        this.authStorage.removeData();
      }),
    );
  }

  public getCurrentUser() {
    return this.us.getCurrentUser();
  }

  private isDevelopmentEnironment(): boolean {
    return isDevMode();
  }
}

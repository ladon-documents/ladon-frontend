import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { LoginRequestModel, UserModel } from '../../api';
import { inject } from '@angular/core';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Router } from '@angular/router';

interface UiState {
  isLoading: boolean;
  isSidenavClosed: boolean;
  isDarkMode: boolean;
  activeTheme?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserModel | null;
  loginError: string | null;
  isAuthenticating: boolean;
}

type AppState = {
  ui: UiState;
  auth: AuthState;
};

const initialState: AppState = {
  ui: { isLoading: false, isDarkMode: false, isSidenavClosed: false },
  auth: { isAuthenticated: false, user: null, loginError: null, isAuthenticating: false },
};

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withHooks({
    onInit: (store, authService = inject(AuthService), router = inject(Router)) => {
      const loadCurrentUser = rxMethod<void>(
        pipe(
          tap(() => {
            patchState(store, (state) => ({
              ...state,
              ui: { ...state.ui },
              auth: { ...state.auth, loginError: null, isAuthenticating: true },
            }));
          }),
          switchMap(() =>
            authService.getCurrentUser().pipe(
              tap((user) => {
                patchState(store, (state) => ({
                  ...state,
                  ui: { ...state.ui },
                  auth: {
                    ...state.auth,
                    isAuthenticated: true,
                    user,
                    loginError: null,
                    isAuthenticating: false,
                  },
                }));
                router.navigateByUrl(`${environment.baseHref}/buckets`);
              }),
              catchError((error) => {
                patchState(store, (state) => ({
                  ...state,
                  ui: { ...state.ui },
                  auth: {
                    ...state.auth,
                    isAuthenticated: false,
                    user: null,
                    loginError: null,
                    isAuthenticating: false,
                  },
                }));
                throw error;
              }),
            ),
          ),
        ),
      );
      loadCurrentUser();
    },
  }),
  withMethods((store, authService = inject(AuthService), router = inject(Router)) => {
    return {
      login: rxMethod<LoginRequestModel>(
        pipe(
          tap(() => {
            patchState(store, (state) => ({
              ...state,
              ui: { ...state.ui },
              auth: { ...state.auth, loginError: null, isAuthenticating: true },
            }));
          }),
          switchMap((credentials) =>
            authService.login(credentials).pipe(
              tap((user) => {
                patchState(store, (state) => ({
                  ...state,
                  ui: { ...state.ui },
                  auth: {
                    ...state.auth,
                    isAuthenticated: true,
                    user,
                    loginError: null,
                    isAuthenticating: false,
                  },
                }));
                router.navigateByUrl(`${environment.baseHref}/buckets`);
              }),
              catchError((error) => {
                patchState(store, (state) => ({
                  ...state,
                  ui: { ...state.ui },
                  auth: {
                    ...state.auth,
                    isAuthenticated: false,
                    user: null,
                    loginError: error.message || 'Anmeldung fehlgeschlagen',
                    isAuthenticating: false,
                  },
                }));
                throw error;
              }),
            ),
          ),
        ),
      ),
      logout() {
        return authService
          .logout()
          .pipe(
            switchMap(() => {
              patchState(store, (state) => ({
                ...state,
                auth: {
                  isAuthenticated: false,
                  user: null,
                  accessToken: null,
                  loginError: null,
                  isAuthenticating: false,
                },
              }));
              return of(void 0);
            }),
          )
          .subscribe(() => {
            router.navigateByUrl(`${environment.baseHref}/login`);
          });
      },
      toggleSidebar: () => {
        patchState(store, (state) => ({
          ...state,
          ui: {
            ...state.ui,
            isSidenavClosed: !state.ui.isSidenavClosed,
          },
        }));
      },
    };
  }),
);

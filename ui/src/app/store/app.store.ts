import { patchState, signalStore, withHooks, withMethods, withProps, withState } from '@ngrx/signals';
import { LoginRequest, User } from '@ladon/api';
import { inject } from '@angular/core';
import { catchError, EMPTY, pipe, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import type { FetchApiError } from '../services/api/fetch-api.factory';
import { environment } from '../../environments/environment';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Router } from '@angular/router';

interface UiState {
  isLoading: boolean;
  isSidenavClosed: boolean;
  isBurgerMenuOpen: boolean;
  isDarkMode: boolean;
  activeTheme?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loginError: string | null;
  isAuthenticating: boolean;
  redirectUrl: string | null;
  requiresTwoFactor: boolean;
}

type AppState = {
  ui: UiState;
  auth: AuthState;
};

const initialState: AppState = {
  ui: { isLoading: false, isDarkMode: false, isSidenavClosed: false, isBurgerMenuOpen: false },
  auth: {
    isAuthenticated: false,
    user: null,
    loginError: null,
    isAuthenticating: true,
    redirectUrl: null,
    requiresTwoFactor: false,
  },
};

const LOGIN_ERROR_FALLBACK = 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.';
const ENCODED_PATH_SEPARATOR = /%(?:25)*(?:2f|5c)/i;

interface SafeRedirect {
  url: string;
  isInternal: boolean;
}

function fallbackRedirectUrl(): string {
  return `${environment.baseHref}/buckets`;
}

function normalizeRedirectUrl(value: string): SafeRedirect | null {
  if (!value || value.includes('\\')) {
    return null;
  }

  const baseHref = environment.baseHref.replace(/^\/+|\/+$/g, '');
  const basePath = `/${baseHref}`;
  const urlValue = value === baseHref || value.startsWith(`${baseHref}/`) ? `/${value}` : value;

  try {
    const url = new URL(urlValue, window.location.origin);
    if (url.origin !== window.location.origin) {
      return null;
    }

    if (ENCODED_PATH_SEPARATOR.test(url.pathname)) {
      return null;
    }

    const isInternal = url.pathname === basePath || url.pathname.startsWith(`${basePath}/`);
    if (url.pathname.startsWith(basePath) && !isInternal) {
      return null;
    }

    return {
      url: `${url.pathname}${url.search}${url.hash}`,
      isInternal,
    };
  } catch {
    return null;
  }
}

function isInternalRoute(url: string): boolean {
  return normalizeRedirectUrl(url)?.isInternal ?? false;
}

function resolveRedirectUrl(redirectUrl: string | null): string {
  if (!redirectUrl) {
    return fallbackRedirectUrl();
  }

  return normalizeRedirectUrl(redirectUrl)?.url ?? fallbackRedirectUrl();
}

function redirectAfterLogin(router: Router, redirectUrl: string): void {
  if (isInternalRoute(redirectUrl)) {
    router.navigateByUrl(redirectUrl);
    return;
  }

  window.location.assign(redirectUrl);
}

function isFetchApiError(error: unknown): error is FetchApiError {
  if (typeof error !== 'object' || error === null || !('error' in error)) {
    return false;
  }

  const normalizedError = error.error;
  return (
    typeof normalizedError === 'object' &&
    normalizedError !== null &&
    'reason' in normalizedError &&
    typeof normalizedError.reason === 'string' &&
    'status' in error &&
    typeof error.status === 'number' &&
    'message' in error &&
    typeof error.message === 'string' &&
    'body' in error &&
    'response' in error &&
    'cause' in error
  );
}

function normalizeLoginError(error: unknown): string {
  if (!isFetchApiError(error)) {
    return LOGIN_ERROR_FALLBACK;
  }

  return error.error.reason.trim() || error.message.trim() || LOGIN_ERROR_FALLBACK;
}

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withProps(() => ({ _authenticationCancellation$: new Subject<void>() })),
  withHooks({
    onInit: (store, authService = inject(AuthService), router = inject(Router)) => {
      const toggleSidenavState = () => {
        const storedSidenavClosed = localStorage.getItem('sidenavClosed');
        const isSidenavClosed = storedSidenavClosed ? storedSidenavClosed === 'true' : false;
        patchState(store, (state) => ({
          ...state,
          ui: {
            ...state.ui,
            isSidenavClosed,
          },
        }));
      };
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
              takeUntil(store._authenticationCancellation$),
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
                    requiresTwoFactor: false,
                  },
                }));
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
                    requiresTwoFactor: false,
                  },
                }));
                return EMPTY;
              }),
            ),
          ),
        ),
      );
      loadCurrentUser();
      toggleSidenavState();
    },
    onDestroy: (store) => store._authenticationCancellation$.complete(),
  }),
  withMethods((store, authService = inject(AuthService), router = inject(Router)) => {
    const resetAuthenticationState = (redirectUrl: string | null): void => {
      patchState(store, (state) => ({
        ...state,
        auth: {
          ...state.auth,
          isAuthenticated: false,
          user: null,
          loginError: null,
          isAuthenticating: false,
          redirectUrl,
          requiresTwoFactor: false,
        },
      }));
    };

    return {
      login: rxMethod<LoginRequest>(
        pipe(
          tap(() => {
            store._authenticationCancellation$.next();
            patchState(store, (state) => ({
              ...state,
              ui: { ...state.ui },
              auth: { ...state.auth, loginError: null, isAuthenticating: true },
            }));
          }),
          switchMap((credentials) =>
            authService.login(credentials).pipe(
              takeUntil(store._authenticationCancellation$),
              tap((result) => {
                if (result.kind === 'two-factor-required') {
                  patchState(store, (state) => ({
                    ...state,
                    auth: {
                      ...state.auth,
                      isAuthenticated: false,
                      user: null,
                      loginError:
                        credentials.twoFactorCode != null
                          ? 'Zwei-Faktor-Code konnte nicht bestätigt werden. Bitte erneut versuchen.'
                          : null,
                      isAuthenticating: false,
                      requiresTwoFactor: true,
                    },
                  }));
                  return;
                }

                patchState(store, (state) => ({
                  ...state,
                  ui: { ...state.ui },
                  auth: {
                    ...state.auth,
                    isAuthenticated: true,
                    user: result.user,
                    loginError: null,
                    isAuthenticating: false,
                    requiresTwoFactor: false,
                  },
                }));
                const redirectUrl = resolveRedirectUrl(store.auth.redirectUrl());
                redirectAfterLogin(router, redirectUrl);
              }),
              catchError((error: unknown) => {
                patchState(store, (state) => ({
                  ...state,
                  ui: { ...state.ui },
                  auth: {
                    ...state.auth,
                    isAuthenticated: false,
                    user: null,
                    loginError: normalizeLoginError(error),
                    isAuthenticating: false,
                  },
                }));
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
      logout() {
        store._authenticationCancellation$.next();
        authService.clearLocalSession();
        resetAuthenticationState(null);
        router.navigateByUrl(`${environment.baseHref}/login`);
        return authService
          .logout()
          .pipe(catchError(() => EMPTY))
          .subscribe();
      },
      setRedirectUrl(url: string) {
        patchState(store, (state) => ({
          ...state,
          auth: {
            ...state.auth,
            redirectUrl: url,
          },
        }));
      },
      resetLoginFlow() {
        store._authenticationCancellation$.next();
        patchState(store, (state) => ({
          ...state,
          auth: {
            ...state.auth,
            requiresTwoFactor: false,
            loginError: null,
            isAuthenticating: false,
          },
        }));
      },
      requireReauthentication(redirectUrl: string) {
        store._authenticationCancellation$.next();
        authService.clearLocalSession();
        resetAuthenticationState(resolveRedirectUrl(redirectUrl));
        router.navigateByUrl(`${environment.baseHref}/login`);
      },
      toggleSidebar: () => {
        patchState(store, (state) => ({
          ...state,
          ui: {
            ...state.ui,
            isSidenavClosed: !state.ui.isSidenavClosed,
          },
        }));
        localStorage.setItem('sidenavClosed', String(store.ui.isSidenavClosed()));
      },
      toggleDarkMode(isDarkMode: boolean) {
        patchState(store, (state) => ({
          ...state,
          ui: {
            ...state.ui,
            isDarkMode,
          },
        }));
      },
      toggleBurgerMenu: () => {
        patchState(store, (state) => ({
          ...state,
          ui: {
            ...state.ui,
            isBurgerMenuOpen: !state.ui.isBurgerMenuOpen,
          },
        }));
      },
    };
  }),
);

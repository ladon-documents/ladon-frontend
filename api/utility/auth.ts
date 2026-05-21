import { Configuration } from '../fetch-client';

export const LADON_AUTH_STORAGE_KEY = '@mind/ladon-auth-name';
export const LEGACY_ACCESS_TOKEN_KEY = 'accessToken';

export interface AuthStorageLike {
  getItem(key: string): string | null;
  setItem?(key: string, value: string): void;
  removeItem?(key: string): void;
}

export interface LadonAuthData {
  accessToken?: string;
  tokenType?: string;
  [key: string]: unknown;
}

export interface StaticAuthOptions {
  storage?: AuthStorageLike;
  storages?: AuthStorageLike[];
  accessToken?: string | (() => string | null | undefined);
  basePath?: string;
  redirectTo?: string;
  location?: Pick<Location, 'href'>;
  credentials?: RequestCredentials;
}

export interface StaticAuthMiddlewareOptions extends StaticAuthOptions {
  skipUrls?: Array<string | RegExp>;
}

const defaultSkipUrls = ['/auth/login'];

function getBrowserStorage(name: 'localStorage' | 'sessionStorage'): AuthStorageLike | undefined {
  try {
    return globalThis[name];
  } catch {
    return undefined;
  }
}

function getDefaultStorages(): AuthStorageLike[] {
  return [getBrowserStorage('sessionStorage'), getBrowserStorage('localStorage')].filter(
    (storage): storage is AuthStorageLike => Boolean(storage),
  );
}

export function getStoredAuthData(storage: AuthStorageLike | undefined = getBrowserStorage('sessionStorage')): LadonAuthData | null {
  const raw = storage?.getItem(LADON_AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as LadonAuthData;
  } catch {
    return null;
  }
}

export function getAccessToken(options: StaticAuthOptions = {}): string | null {
  if (typeof options.accessToken === 'string') {
    return options.accessToken;
  }

  if (typeof options.accessToken === 'function') {
    return options.accessToken() ?? null;
  }

  const storages = options.storage ? [options.storage] : options.storages ?? getDefaultStorages();

  for (const storage of storages) {
    const authData = getStoredAuthData(storage);
    const accessToken = authData?.accessToken || storage.getItem(LEGACY_ACCESS_TOKEN_KEY);
    if (accessToken) {
      return accessToken;
    }
  }

  return null;
}

export function storeAccessToken(accessToken: string, storage: AuthStorageLike | undefined = getBrowserStorage('sessionStorage')): void {
  if (!storage?.setItem) {
    return;
  }

  const currentAuthData = getStoredAuthData(storage) ?? {};
  storage.setItem(LADON_AUTH_STORAGE_KEY, JSON.stringify({ ...currentAuthData, accessToken }));
  storage.setItem(LEGACY_ACCESS_TOKEN_KEY, accessToken);
}

export function clearAccessToken(storage?: AuthStorageLike): void {
  const storages = storage ? [storage] : getDefaultStorages();

  for (const targetStorage of storages) {
    targetStorage.removeItem?.(LADON_AUTH_STORAGE_KEY);
    targetStorage.removeItem?.(LEGACY_ACCESS_TOKEN_KEY);
  }
}

function shouldSkipAuthHeader(url: string, skipUrls: Array<string | RegExp>): boolean {
  return skipUrls.some((skipUrl) => (typeof skipUrl === 'string' ? url.includes(skipUrl) : skipUrl.test(url)));
}

function withAuthorizationHeader(headers: HeadersInit | undefined, token: string): HeadersInit {
  if (headers instanceof Headers) {
    const nextHeaders = new Headers(headers);
    nextHeaders.set('Authorization', `Bearer ${token}`);
    return nextHeaders;
  }

  if (Array.isArray(headers)) {
    return [...headers.filter(([key]) => key.toLowerCase() !== 'authorization'), ['Authorization', `Bearer ${token}`]];
  }

  return {
    ...(headers || {}),
    Authorization: `Bearer ${token}`,
  };
}

export function createAuthMiddleware(options: StaticAuthMiddlewareOptions = {}) {
  const skipUrls = options.skipUrls ?? defaultSkipUrls;

  return {
    pre: async ({ url, init }: { url: string; init: RequestInit }) => {
      const token = getAccessToken(options);
      if (!token || shouldSkipAuthHeader(url, skipUrls)) {
        return { url, init };
      }

      return {
        url,
        init: {
          ...init,
          headers: withAuthorizationHeader(init.headers, token),
        },
      };
    },
  };
}

export function createAuthenticatedConfiguration(options: StaticAuthOptions = {}): Configuration {
  return new Configuration({
    basePath: options.basePath,
    credentials: options.credentials,
    middleware: [createAuthMiddleware(options)],
  });
}

export function createAuthenticatedApi<T>(
  ApiClass: new (configuration?: Configuration) => T,
  options: StaticAuthOptions = {},
): T {
  return new ApiClass(createAuthenticatedConfiguration(options));
}

export function ensureAuthenticated(options: StaticAuthOptions = {}): boolean {
  if (getAccessToken(options)) {
    return true;
  }

  if (options.redirectTo) {
    const locationRef = options.location ?? globalThis.location;
    locationRef.href = options.redirectTo;
  }

  return false;
}

export const auth = {
  LADON_AUTH_STORAGE_KEY,
  LEGACY_ACCESS_TOKEN_KEY,
  getStoredAuthData,
  getAccessToken,
  storeAccessToken,
  clearAccessToken,
  createAuthMiddleware,
  createAuthenticatedConfiguration,
  createAuthenticatedApi,
  ensureAuthenticated,
};

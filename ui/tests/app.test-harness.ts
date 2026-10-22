import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Location } from '@angular/common';
import { Provider } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { defer, of } from 'rxjs';

import { FetchApiFactory } from '../src/app/services/api/fetch-api.factory';

/**
 * Test-only harness for the "should create / should be created" regression net.
 *
 * The real component/service tree resolves its dependencies down to a couple of
 * leaves that are contextual in a browser router but unavailable in a bare
 * TestBed:
 *   * `ActivatedRoute` (reached via LadonRouterService and rendered children)
 *   * `Location` (injected by LadonRouterService)
 *   * `FetchApiFactory` sub-apis — `ConverterService` eagerly calls
 *     `converterApi.listConverterInfo()` in its constructor, which would fire a
 *     real network request otherwise.
 *   * `HttpClient` — `TaskmanagerService` injects it (via `HttpClientTestingModule`).
 *
 * The router itself is the real `RouterTestingModule` (no routes registered), so
 * `<router-outlet>` renders nothing harmlessly; only `ActivatedRoute` /
 * `Location` / `FetchApiFactory` are swapped for inert fakes. No service contract
 * is weakened — these only supply the leaves a bare injector cannot.
 */

export function fakeActivatedRoute(overrides: Partial<ActivatedRoute> = {}): ActivatedRoute {
  return {
    parent: null,
    pathFromRoot: [],
    outlet: 'primary',
    routeConfig: null,
    url: [],
    params: of({}),
    data: of({}),
    queryParams: of({}),
    paramMap: of(convertToParamMap({})),
    fragment: of({}),
    ...overrides,
  } as unknown as ActivatedRoute;
}

export function fakeLocation(): jasmine.SpyObj<Location> {
  return jasmine.createSpyObj<Location>('Location', ['go', 'replaceState', 'path', 'back', 'forward', 'getState']);
}

export function buildFetchApiFactoryMock(): FetchApiFactory {
  const subApi = () =>
    new Proxy(
      {},
      {
        // Sub-apis expose methods that resolve to an empty list — enough for a
        // "should be created" smoke test without firing a real network request,
        // while still exposing `.then`/callability shape to the caller.
        get: (_target, prop) => {
          if (prop === 'then' || prop === Symbol.toPrimitive) return undefined;
          return () => Promise.resolve([]);
        },
      },
    );

  // The real Factory exposes `fromApi(request): Observable<T>` plus the named
  // sub-apis. `fromApi` must return a subscribable observable (deferred request),
  // otherwise services that pipe it (e.g. TaskmanagerService) throw at init.
  const target = {
    fromApi: (request: () => Promise<unknown>) => defer(request),
    authControllerApi: subApi(),
    twoFactorAuthenticationApi: subApi(),
    userControllerApi: subApi(),
    documentsApi: subApi(),
    converterApi: subApi(),
    tasksApi: subApi(),
    uiApi: subApi(),
    bucketsApi: subApi(),
    usermanagerApi: subApi(),
    tagmanagerApi: subApi(),
    transactionApi: subApi(),
    pluginmanagerApi: subApi(),
    pluginV1Api: subApi(),
  };

  // Fallback for any not-yet-listed sub-api / helper without a real contract.
  // `ownKeys` / `getOwnPropertyDescriptor` make the proxy spread-safe so a test
  // can do `{ ...buildFetchApiFactoryMock(), documentsApi: mySpy }`.
  return new Proxy(
    target,
    {
      get(trapTarget, prop) {
        if (prop === 'then' || prop === Symbol.toPrimitive) return undefined;
        if (typeof prop === 'string' && prop in trapTarget) {
          return (trapTarget as Record<string, unknown>)[prop];
        }
        return subApi();
      },
      ownKeys() {
        return Reflect.ownKeys(target);
      },
      getOwnPropertyDescriptor(trapTarget, prop) {
        return Reflect.getOwnPropertyDescriptor(trapTarget, prop);
      },
      has() {
        return true;
      },
    },
  ) as unknown as FetchApiFactory;
}

export const smokeTestImports = [RouterTestingModule, HttpClientTestingModule];

export function smokeTestProviders(): Provider[] {
  return [
    { provide: ActivatedRoute, useFactory: () => fakeActivatedRoute(), deps: [] },
    { provide: Location, useFactory: () => fakeLocation(), deps: [] },
    { provide: FetchApiFactory, useFactory: () => buildFetchApiFactoryMock(), deps: [] },
  ];
}

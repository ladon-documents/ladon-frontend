# Logout Ordering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore backend-first logout so protected page components cannot race the login navigation, while local logout still completes when the backend fails.

**Architecture:** `AuthService.logout()` owns only the backend request. `AppStore.logout()` subscribes to that request and uses a single `finalize` cleanup path for authentication cancellation, local credential removal, state reset, and login navigation on both success and error.

**Tech Stack:** Angular 19.2, NgRx Signal Store, RxJS, Jasmine/Karma

**Command context:** Run Angular, TypeScript, formatting, and build commands from `ui/`. Run every Git command from the repository worktree root.

---

### Task 1: Make the authentication service backend-only during logout

**Files:**
- Modify: `ui/src/app/services/auth.service.ts:86-94`
- Test: `ui/src/app/services/auth.service.spec.ts`

- [ ] **Step 1: Write the failing service test**

Add a test proving a successful backend logout does not perform local cleanup inside `AuthService`:

```ts
it('leaves local session cleanup to the store after backend logout succeeds', async () => {
  authControllerApi.logout.and.resolveTo({});

  await firstValueFrom(service.logout());

  expect(authControllerApi.logout).toHaveBeenCalledTimes(1);
  expect(authStorage.removeData).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Temporarily restrict `ui/tsconfig.spec.json` to `src/app/services/auth.service.spec.ts`, then run:

```bash
/Users/merihguerlek/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  /Users/merihguerlek/WebstormProjects/ladon-frontend/node_modules/@angular/cli/bin/ng.js test \
  --watch=false \
  --browsers=ChromeHeadless \
  --include=src/app/services/auth.service.spec.ts
```

Expected: FAIL because the current `tap` calls `authStorage.removeData()`.

- [ ] **Step 3: Implement the backend-only service method**

Replace the current logout pipeline with:

```ts
public logout() {
  return this.apiFactory.fromApi(() => this.apiFactory.authControllerApi.logout());
}
```

Do not change login cleanup or `clearLocalSession()`.

- [ ] **Step 4: Run the focused service test and verify GREEN**

Run the command from Step 2.

Expected: all `AuthService` specs pass.

- [ ] **Step 5: Restore `ui/tsconfig.spec.json` and commit**

```bash
git add ui/src/app/services/auth.service.ts ui/src/app/services/auth.service.spec.ts
git commit -m "refactor(auth): centralize logout cleanup in store"
```

### Task 2: Wait for backend logout before clearing state and navigating

**Files:**
- Modify: `ui/src/app/store/app.store.ts:1-5,290-299`
- Test: `ui/src/app/store/app.store.spec.ts:265-350`

- [ ] **Step 1: Write the failing pending-logout regression test**

Use a `Subject<object>` as the backend logout result and an established authenticated store:

```ts
it('keeps the established session active until backend logout completes', () => {
  const logoutResult = new Subject<object>();
  const store = createStore(of(user));
  authService.logout.and.returnValue(logoutResult);
  auth.storeAccessToken('active-token');
  authService.clearLocalSession.and.callFake(() => auth.clearAccessToken());
  router.navigateByUrl.calls.reset();

  store.logout();

  expect(authService.clearLocalSession).not.toHaveBeenCalled();
  expect(auth.getAccessToken()).toBe('active-token');
  expect(store.auth.isAuthenticated()).toBeTrue();
  expect(store.auth.user()).toEqual(user);
  expect(router.navigateByUrl).not.toHaveBeenCalled();

  logoutResult.next({});
  logoutResult.complete();

  expect(authService.clearLocalSession).toHaveBeenCalledTimes(1);
  expect(auth.getAccessToken()).toBeNull();
  expect(store.auth.isAuthenticated()).toBeFalse();
  expect(store.auth.user()).toBeNull();
  expect(router.navigateByUrl).toHaveBeenCalledOnceWith(`${environment.baseHref}/login`);
});
```

Import `auth` from `@ladon/api`. Preserve the pre-test values of `auth.LADON_AUTH_STORAGE_KEY` and `auth.LEGACY_ACCESS_TOKEN_KEY` in both session and local storage and restore them in `afterEach`, following the storage-isolation pattern in `auth.service.spec.ts`.

Update the pending-login test so it expects cancellation only after the backend logout settles. Keep the existing backend-error test; it must continue proving that local logout and navigation happen on error.

- [ ] **Step 2: Run the focused store test and verify RED**

Temporarily restrict `ui/tsconfig.spec.json` to `src/app/store/app.store.spec.ts`, then run:

```bash
/Users/merihguerlek/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  /Users/merihguerlek/WebstormProjects/ladon-frontend/node_modules/@angular/cli/bin/ng.js test \
  --watch=false \
  --browsers=ChromeHeadless \
  --include=src/app/store/app.store.spec.ts
```

Expected: FAIL because current logout immediately clears the session, resets state, navigates, and cancels pending authentication.

- [ ] **Step 3: Implement one guaranteed completion path**

Import `finalize` from RxJS and change the store method to:

```ts
logout() {
  return authService
    .logout()
    .pipe(
      catchError(() => EMPTY),
      finalize(() => {
        store._authenticationCancellation$.next();
        authService.clearLocalSession();
        resetAuthenticationState(null);
        void router.navigateByUrl(`${environment.baseHref}/login`);
      }),
    )
    .subscribe();
}
```

The finalizer must be the only cleanup/navigation path in this method.

- [ ] **Step 4: Run the focused store test and verify GREEN**

Run the command from Step 2.

Expected: all `AppStore` specs pass, including success, failure, established-session, and pending-authentication cases.

- [ ] **Step 5: Restore `ui/tsconfig.spec.json` and commit**

```bash
git add ui/src/app/store/app.store.ts ui/src/app/store/app.store.spec.ts
git commit -m "fix(auth): complete backend logout before navigation"
```

### Task 3: Verify the complete authentication change

**Files:**
- Verify only; no planned production changes

- [ ] **Step 1: Format and inspect**

Run Prettier on the four modified TypeScript files, followed by:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors and only intended files changed.

- [ ] **Step 2: Run the affected Auth/2FA/routing suite**

Temporarily restrict `ui/tsconfig.spec.json` to the existing eleven Auth/2FA/routing spec files plus the modified service and store specs, then run Angular tests with matching `--include` arguments.

The exact files are:

```text
src/app/services/api/fetch-api.factory.spec.ts
src/app/services/auth.service.spec.ts
src/app/services/two-factor.service.spec.ts
src/app/store/app.store.spec.ts
src/app/login/login.component.spec.ts
src/app/login/login-redirect.integration.spec.ts
src/app/account-settings/account-settings.component.spec.ts
src/app/app.routes.spec.ts
src/app/avatar/avatar.component.spec.ts
src/app/rapidweb/rapid-runtime-facade.service.spec.ts
src/app/shared/guards/auth/can-activate-login.spec.ts
```

Run from `ui/`:

```bash
/Users/merihguerlek/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  /Users/merihguerlek/WebstormProjects/ladon-frontend/node_modules/@angular/cli/bin/ng.js test \
  --watch=false --browsers=ChromeHeadless \
  --include=src/app/services/api/fetch-api.factory.spec.ts \
  --include=src/app/services/auth.service.spec.ts \
  --include=src/app/services/two-factor.service.spec.ts \
  --include=src/app/store/app.store.spec.ts \
  --include=src/app/login/login.component.spec.ts \
  --include=src/app/login/login-redirect.integration.spec.ts \
  --include=src/app/account-settings/account-settings.component.spec.ts \
  --include=src/app/app.routes.spec.ts \
  --include=src/app/avatar/avatar.component.spec.ts \
  --include=src/app/rapidweb/rapid-runtime-facade.service.spec.ts \
  --include=src/app/shared/guards/auth/can-activate-login.spec.ts
```

Expected: all selected tests pass.

- [ ] **Step 3: Run compiler verification**

```bash
/Users/merihguerlek/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  /Users/merihguerlek/WebstormProjects/ladon-frontend/node_modules/typescript/bin/tsc \
  --noEmit -p tsconfig.app.json
/Users/merihguerlek/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  /Users/merihguerlek/WebstormProjects/ladon-frontend/node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js \
  -p tsconfig.app.json
```

Expected: both commands exit successfully without diagnostics.

- [ ] **Step 4: Run the production build**

```bash
/Users/merihguerlek/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  /Users/merihguerlek/WebstormProjects/ladon-frontend/node_modules/@angular/cli/bin/ng.js build \
  --configuration production
```

Expected: build succeeds; existing DaisyUI selector warnings are allowed.

- [ ] **Step 5: Confirm final branch state**

Restore any temporary test configuration, then run:

```bash
git status --short
git log -4 --oneline
```

Expected: clean worktree and local logout-fix commits on `codex/two-factor-authentication`; do not push.

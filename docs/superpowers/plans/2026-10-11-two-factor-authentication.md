# Two-Factor Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared, typed TOTP 2FA API for Angular and Rapids, extend login with a second-factor step, and provide an authenticated account-settings activation flow with one-time backup-code handling.

**Architecture:** Synchronize the existing backend contracts into `spec/api.yaml` and regenerate the shared TypeScript fetch client. Keep authentication orchestration in `AuthService`/`AppStore`, keep secrets only in component-local reactive forms or signals, and expose setup through a focused `TwoFactorService` and guarded account-settings component. The existing Rapids facade continues exposing the generated `fetchClient` without a parallel handwritten REST client.

**Tech Stack:** OpenAPI 3.0, OpenAPI Generator `typescript-fetch`, TypeScript 5.7, Angular 19 standalone components, Angular signals, NgRx Signal Store, RxJS 7, Reactive Forms, Tailwind CSS, DaisyUI, Angular CDK Clipboard, Jasmine/Karma, Node test runner.

---

## File map

### API contract and generated client

- Modify `spec/api.yaml` — add the live backend 2FA schemas and operations.
- Regenerate `api/fetch-client/apis/AuthControllerApi.ts` — typed `AuthResponse` for login.
- Create through generation `api/fetch-client/apis/TwoFactorAuthenticationApi.ts` — QR and confirm operations.
- Modify through generation `api/fetch-client/apis/index.ts` and `api/fetch-client/index.ts` — exports.
- Modify through generation `api/fetch-client/models/LoginRequest.ts` — optional `twoFactorCode`.
- Create through generation `api/fetch-client/models/AuthResponse.ts`.
- Create through generation `api/fetch-client/models/ApiResponse.ts`.
- Create through generation `api/fetch-client/models/TwoFactorVerificationRequest.ts`.
- Create through generation `api/fetch-client/models/TwoFactorConfirmResponse.ts`.
- Modify through generation `api/fetch-client/models/index.ts` — model exports.
- Create `api/utility/two-factor-api.test.mjs` — generated-client contract and runtime tests.
- Modify `api/utility/auth-static.test.mjs` — verify default cookie credentials.

### Angular authentication flow

- Modify `ui/src/app/services/api/fetch-api.factory.ts` — cookie configuration and generated 2FA API instance.
- Modify `ui/src/app/services/api/fetch-api.factory.spec.ts` — cookie and API instance tests.
- Modify `ui/src/app/services/auth.service.ts` — discriminated login result and local-session clearing.
- Replace the placeholder tests in `ui/src/app/services/auth.service.spec.ts`.
- Modify `ui/src/app/store/app.store.ts` — non-secret 2FA state and re-authentication method.
- Create `ui/src/app/store/app.store.spec.ts` — authentication state-transition tests.
- Modify `ui/src/app/login/login.component.ts`.
- Modify `ui/src/app/login/login.component.html`.
- Replace the placeholder tests in `ui/src/app/login/login.component.spec.ts`.

### 2FA activation UI

- Create `ui/src/app/services/two-factor.service.ts`.
- Create `ui/src/app/services/two-factor.service.spec.ts`.
- Create `ui/src/app/account-settings/account-settings.component.ts`.
- Create `ui/src/app/account-settings/account-settings.component.html`.
- Create `ui/src/app/account-settings/account-settings.component.spec.ts`.
- Modify `ui/src/app/app.routes.ts` and `ui/src/app/app.routes.spec.ts`.
- Modify `ui/src/app/avatar/avatar.component.ts`, `.html`, and `.spec.ts`.
- Modify `ui/src/app/rapidweb/rapid-runtime-facade.service.spec.ts` — verify the generated 2FA client is reachable by Rapids.

No new component stylesheet is required; use the shared Tailwind/DaisyUI classes.

## Task 1: Synchronize and generate the shared 2FA API

**Files:**
- Create: `api/utility/two-factor-api.test.mjs`
- Modify: `spec/api.yaml`
- Regenerate: `api/fetch-client/**`

Use `@superpowers:test-driven-development`. Do not hand-edit generated files.

- [ ] **Step 1: Write the failing generated-client contract test**

Create `api/utility/two-factor-api.test.mjs` with tests that exercise the public static bundle:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

const api = await import('../dist/ladon-api/ladon-api-static.mjs');

test('exports the generated two-factor API and models', () => {
  assert.equal(typeof api.fetchClient.TwoFactorAuthenticationApi, 'function');
  assert.equal(typeof api.fetchClient.LoginRequestToJSON, 'function');
  assert.equal(typeof api.fetchClient.TwoFactorVerificationRequestToJSON, 'function');
});

test('serializes the optional two-factor login code', () => {
  assert.deepEqual(
    api.fetchClient.LoginRequestToJSON({
      email: 'user@example.org',
      password: 'secret',
      twoFactorCode: '123456',
    }),
    { email: 'user@example.org', password: 'secret', twoFactorCode: '123456' },
  );
});

test('requests the QR code as a blob with cookies', async () => {
  let request;
  const client = new api.fetchClient.TwoFactorAuthenticationApi(
    new api.fetchClient.Configuration({
      basePath: '/admin',
      credentials: 'include',
      fetchApi: async (url, init) => {
        request = { url, init };
        return new Response(new Blob(['png'], { type: 'image/png' }), {
          status: 200,
          headers: { 'Content-Type': 'image/png' },
        });
      },
    }),
  );

  const result = await client.setupTwoFactorQrCode();

  assert.equal(request.url, '/admin/auth/2fa/setup/qr');
  assert.equal(request.init.method, 'POST');
  assert.equal(request.init.credentials, 'include');
  assert.equal(result.type, 'image/png');
});

test('posts the confirmation code and returns backup codes', async () => {
  let request;
  const client = new api.fetchClient.TwoFactorAuthenticationApi(
    new api.fetchClient.Configuration({
      basePath: '/admin',
      credentials: 'include',
      fetchApi: async (url, init) => {
        request = { url, init };
        return new Response(
          JSON.stringify({ success: true, message: '2FA wurde aktiviert', backupCodes: ['K7DM-Q92A'] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      },
    }),
  );

  const result = await client.confirmTwoFactorAuthentication({
    twoFactorVerificationRequest: { code: '123456' },
  });

  assert.equal(request.url, '/admin/auth/2fa/confirm');
  assert.deepEqual(JSON.parse(request.init.body), { code: '123456' });
  assert.deepEqual(result.backupCodes, ['K7DM-Q92A']);
});
```

- [ ] **Step 2: Run the new test against the current bundle**

Run:

```bash
npm run build:static
node --test api/utility/two-factor-api.test.mjs
```

Expected: FAIL because `TwoFactorAuthenticationApi` and the new serializers do not exist.

- [ ] **Step 3: Add the targeted live contracts to `spec/api.yaml`**

Keep the existing `auth-controller` tag for login/logout compatibility. Change `/auth/login` to return `AuthResponse` on `200` and `ApiResponse` on `400`. Add the two backend operations with their live operation IDs:

```yaml
  /auth/2fa/setup/qr:
    post:
      tags: [TwoFactorAuthentication]
      operationId: setupTwoFactorQrCode
      responses:
        '200':
          description: PNG QR-Code for 2FA registration
          headers:
            Cache-Control: { schema: { type: string } }
            Pragma: { schema: { type: string } }
            Content-Disposition: { schema: { type: string } }
          content:
            image/png:
              schema:
                type: string
                format: binary
        '401':
          description: Not authenticated
  /auth/2fa/confirm:
    post:
      tags: [TwoFactorAuthentication]
      operationId: confirmTwoFactorAuthentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TwoFactorVerificationRequest'
      responses:
        '200':
          description: 2FA activated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TwoFactorConfirmResponse'
        '400':
          description: Invalid or missing 2FA code
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiResponse'
        '401':
          description: Not authenticated
```

Add these schemas, reflecting the live Swagger document:

```yaml
    LoginRequest:
      type: object
      properties:
        email: { type: string }
        password: { type: string }
        twoFactorCode:
          type: string
          nullable: true
    AuthResponse:
      type: object
      required: [accessToken, tokenType, requiresTwoFactor]
      properties:
        accessToken: { type: string }
        tokenType: { type: string }
        requiresTwoFactor: { type: boolean }
    ApiResponse:
      type: object
      required: [success]
      properties:
        success: { type: boolean }
        message: { type: string }
        reason: { type: string }
    TwoFactorVerificationRequest:
      type: object
      required: [code]
      properties:
        code: { type: string }
    TwoFactorConfirmResponse:
      type: object
      required: [success, backupCodes]
      properties:
        success: { type: boolean }
        message: { type: string }
        backupCodes:
          type: array
          items: { type: string }
```

- [ ] **Step 4: Regenerate and build the shared client**

Run:

```bash
npm run build:static
```

Expected: PASS and generation creates `TwoFactorAuthenticationApi` plus the four new models. Review the diff and confirm no unrelated backend-contract churn.

- [ ] **Step 5: Run the API tests**

Run:

```bash
node --test api/utility/auth-static.test.mjs api/utility/two-factor-api.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit the contract and generated client**

```bash
git add spec/api.yaml api/fetch-client api/utility/two-factor-api.test.mjs
git commit -m "feat(api): generate two-factor authentication client"
```

## Task 2: Make cookie credentials explicit in the shared configuration

**Files:**
- Modify: `api/utility/auth.ts`
- Modify: `api/utility/auth-static.test.mjs`
- Modify: `ui/src/app/services/api/fetch-api.factory.ts`
- Modify: `ui/src/app/services/api/fetch-api.factory.spec.ts`

- [ ] **Step 1: Add failing cookie-configuration tests**

In `api/utility/auth-static.test.mjs`, assert the default:

```js
test('authenticated configuration includes cookies by default', () => {
  const configuration = api.auth.createAuthenticatedConfiguration();
  assert.equal(configuration.credentials, 'include');
});
```

In `fetch-api.factory.spec.ts`, add a test that `twoFactorAuthenticationApi` exists and a login call uses `credentials: 'include'` by spying on `window.fetch` and resolving an `AuthResponse`.

- [ ] **Step 2: Run the focused tests**

Run:

```bash
npm run build:static
node --test api/utility/auth-static.test.mjs
npm test -w @ladon/ui -- --watch=false --browsers=ChromeHeadless --include='src/app/services/api/fetch-api.factory.spec.ts'
```

Expected: FAIL because the default credential mode and 2FA API instance are absent.

- [ ] **Step 3: Implement the default and API instance**

Change the shared configuration to preserve an explicit override but default to cookies:

```ts
export function createAuthenticatedConfiguration(options: StaticAuthOptions = {}): Configuration {
  return new Configuration({
    basePath: options.basePath,
    credentials: options.credentials ?? 'include',
    middleware: [createAuthMiddleware(options)],
  });
}
```

Add to `FetchApiFactory`:

```ts
readonly twoFactorAuthenticationApi = new fetchClient.TwoFactorAuthenticationApi(this.mainConfiguration);
```

- [ ] **Step 4: Re-run focused tests**

Run the commands from Step 2.

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/utility/auth.ts api/utility/auth-static.test.mjs ui/src/app/services/api/fetch-api.factory.ts ui/src/app/services/api/fetch-api.factory.spec.ts
git commit -m "feat(auth): include cookies in authenticated api calls"
```

## Task 3: Refactor `AuthService` into a typed two-stage login boundary

**Files:**
- Modify: `ui/src/app/services/auth.service.ts`
- Modify: `ui/src/app/services/auth.service.spec.ts`

- [ ] **Step 1: Replace the placeholder service tests**

Test these exact outcomes with typed Jasmine spies for `FetchApiFactory` and `AuthStorageService`:

1. `requiresTwoFactor: true` returns `{ kind: 'two-factor-required' }`, does not store an empty token, and does not call `getCurrentUser`.
2. A completed response stores `accessToken`/`tokenType`, loads the user, and returns `{ kind: 'authenticated', user }`.
3. A completed response without an access token throws a stable error.
4. `clearLocalSession()` removes both the structured `@mind/ladon-auth-name` entry and the supported legacy `accessToken` key from session and local storage without calling logout.

Use fixtures:

```ts
const authResponse: AuthResponse = {
  accessToken: 'token',
  tokenType: 'Bearer',
  requiresTwoFactor: false,
};
const twoFactorResponse: AuthResponse = {
  accessToken: '',
  tokenType: 'Bearer',
  requiresTwoFactor: true,
};
```

- [ ] **Step 2: Run the focused service test**

```bash
npm test -w @ladon/ui -- --watch=false --browsers=ChromeHeadless --include='src/app/services/auth.service.spec.ts'
```

Expected: FAIL because login always stores/chains to the current user and uses `any`.

- [ ] **Step 3: Implement a discriminated result**

Use this public contract:

```ts
export type LoginResult =
  | { kind: 'two-factor-required' }
  | { kind: 'authenticated'; user: User };
```

Implement `login(request: LoginRequest): Observable<LoginResult>` so that it:

- calls the generated typed `authenticateUser` without casts;
- returns immediately for `requiresTwoFactor`;
- rejects a completed response with no token;
- stores only a non-empty token and token type;
- loads and validates the current user only after authentication completes.

Add:

```ts
public clearLocalSession(): void {
  this.authStorage.removeData();
  auth.clearAccessToken();
}
```

Import the shared `auth` utility from `@ladon/api`. The service test must seed both supported storage keys in session and local storage, call `clearLocalSession()`, and assert that all copies are gone. This prevents a stale bearer token from surviving a forced re-authentication.

Remove the unused development helper.

- [ ] **Step 4: Re-run the service test**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ui/src/app/services/auth.service.ts ui/src/app/services/auth.service.spec.ts
git commit -m "refactor(auth): model two-stage login result"
```

## Task 4: Add non-secret 2FA workflow state to `AppStore`

**Files:**
- Create: `ui/src/app/store/app.store.spec.ts`
- Modify: `ui/src/app/store/app.store.ts`

- [ ] **Step 1: Write failing store tests**

Configure `TestBed` with an `AuthService` spy and `Router` spy. Cover:

- a `two-factor-required` result sets `requiresTwoFactor` and stops loading without setting `isAuthenticated` or navigating;
- a `two-factor-required` result after a request that already contained `twoFactorCode` stays in the TOTP step and sets the stable workflow error `Zwei-Faktor-Code konnte nicht bestätigt werden. Bitte erneut versuchen.`;
- an authenticated result sets the user, clears `requiresTwoFactor`, and redirects through the existing safe redirect resolver;
- a login error preserves the current step and exposes only the normalized error message;
- `resetLoginFlow()` clears `requiresTwoFactor` and `loginError`;
- `requireReauthentication(url)` clears local auth, stores the redirect URL, resets auth state, and navigates to login.

- [ ] **Step 2: Run the focused store tests**

```bash
npm test -w @ladon/ui -- --watch=false --browsers=ChromeHeadless --include='src/app/store/app.store.spec.ts'
```

Expected: FAIL because the new state and methods do not exist.

- [ ] **Step 3: Extend only non-secret state**

Add to `AuthState` and `initialState.auth`:

```ts
requiresTwoFactor: boolean;
```

Update the existing `login` rxMethod to branch on `LoginResult.kind`. Never assign the request, password, or code into state. When the result is `two-factor-required`, inspect only whether the current request contained a code: the first request transitions silently into the TOTP step, while a request with `twoFactorCode` sets the stable workflow error from Step 1 and remains in that step. Add:

```ts
resetLoginFlow(): void { /* clear requiresTwoFactor/loginError/loading */ }
requireReauthentication(redirectUrl: string): void { /* clear local session, patch state, navigate */ }
```

Ensure logout and initial-user failure also reset `requiresTwoFactor`.

- [ ] **Step 4: Run the store tests**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ui/src/app/store/app.store.ts ui/src/app/store/app.store.spec.ts
git commit -m "feat(auth): track two-factor login step"
```

## Task 5: Implement the two-step login UI

**Files:**
- Modify: `ui/src/app/login/login.component.ts`
- Modify: `ui/src/app/login/login.component.html`
- Modify: `ui/src/app/login/login.component.spec.ts`

Use `@angular-architect` conventions: standalone component, OnPush, signals, reactive forms, native control flow, accessible labels, and Tailwind/DaisyUI classes. Do not add component CSS.

- [ ] **Step 1: Write failing component tests**

Provide a controlled `AppStore` stub whose nested properties are writable signals. Test:

- the initial form contains email/password but no TOTP field;
- valid initial submission calls `store.login()` without `twoFactorCode`;
- `requiresTwoFactor()` displays the instruction and TOTP input;
- the second submission sends the same email/password plus a six-digit code;
- non-six-digit or non-numeric codes keep the action disabled;
- a changed login error in the TOTP step clears and focuses the code input;
- `backToCredentials()` calls `resetLoginFlow()` and clears password/code;
- destruction resets the login flow and clears form secrets.

- [ ] **Step 2: Run the component test**

```bash
npm test -w @ladon/ui -- --watch=false --browsers=ChromeHeadless --include='src/app/login/login.component.spec.ts'
```

Expected: FAIL.

- [ ] **Step 3: Implement typed local form state**

Use `NonNullableFormBuilder`, `ChangeDetectionStrategy.OnPush`, and a local optional TOTP control. Expose store signals without copying secrets:

```ts
readonly requiresTwoFactor = this.#store.auth.requiresTwoFactor;
readonly loginError = this.#store.auth.loginError;
readonly isAuthenticating = this.#store.auth.isAuthenticating;
```

When the second step becomes active, add a `twoFactorCode` control with:

```ts
[Validators.required, Validators.pattern(/^\d{6}$/)]
```

Use `getRawValue()` because email/password are rendered readonly in step two. Build a fresh `LoginRequest` for each submit and include `twoFactorCode` only in the second step.

Use a `viewChild<ElementRef<HTMLInputElement>>` plus an effect to focus the TOTP input on entry and after an error. Queue focus until after the conditional view renders.

Implement `OnDestroy` to clear `password`, clear/remove `twoFactorCode`, and call `resetLoginFlow()`.

- [ ] **Step 4: Update the DaisyUI template**

Keep the existing card and mascot. Add native `@if (requiresTwoFactor())` control flow, an `alert alert-error` for `loginError`, and:

```html
<input
  #twoFactorInput
  class="grow tracking-[0.35em]"
  type="text"
  formControlName="twoFactorCode"
  inputmode="numeric"
  autocomplete="one-time-code"
  maxlength="6"
  aria-label="Zwei-Faktor-Code"
  aria-describedby="two-factor-code-error" />
```

When the TOTP control is touched and invalid, render an `id="two-factor-code-error"` validation message explaining that exactly six digits are required. Bind `aria-invalid` to the control state so the disabled submit button is not the only error signal.

Use `autocomplete="email"` and `autocomplete="current-password"` in step one. Set email/password to readonly during step two. Change the primary label to `Mit 2FA anmelden`, show a loading class while authenticating, and add a secondary `Zurück` action.

- [ ] **Step 5: Run the component and store/service tests together**

```bash
npm test -w @ladon/ui -- --watch=false --browsers=ChromeHeadless \
  --include='src/app/login/login.component.spec.ts' \
  --include='src/app/store/app.store.spec.ts' \
  --include='src/app/services/auth.service.spec.ts'
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add ui/src/app/login ui/src/app/store/app.store.ts
git commit -m "feat(ui): add two-factor login step"
```

## Task 6: Add the Angular 2FA setup service

**Files:**
- Create: `ui/src/app/services/two-factor.service.ts`
- Create: `ui/src/app/services/two-factor.service.spec.ts`

- [ ] **Step 1: Write failing service tests**

Mock `FetchApiFactory` and verify:

- `loadSetupQrCode()` delegates to `setupTwoFactorQrCode()` and returns the PNG `Blob` unchanged;
- `confirm(code)` delegates with `{ twoFactorVerificationRequest: { code } }` and returns `TwoFactorConfirmResponse`;
- generated `ResponseError` values are normalized by `FetchApiFactory.fromApi` rather than swallowed.

- [ ] **Step 2: Run the focused test**

```bash
npm test -w @ladon/ui -- --watch=false --browsers=ChromeHeadless --include='src/app/services/two-factor.service.spec.ts'
```

Expected: FAIL because the service is absent.

- [ ] **Step 3: Implement the focused service**

```ts
@Injectable({ providedIn: 'root' })
export class TwoFactorService {
  readonly #apiFactory = inject(FetchApiFactory);

  loadSetupQrCode(): Observable<Blob> {
    return this.#apiFactory.fromApi(() =>
      this.#apiFactory.twoFactorAuthenticationApi.setupTwoFactorQrCode(),
    );
  }

  confirm(code: string): Observable<TwoFactorConfirmResponse> {
    return this.#apiFactory.fromApi(() =>
      this.#apiFactory.twoFactorAuthenticationApi.confirmTwoFactorAuthentication({
        twoFactorVerificationRequest: { code },
      }),
    );
  }
}
```

- [ ] **Step 4: Re-run the test**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ui/src/app/services/two-factor.service.ts ui/src/app/services/two-factor.service.spec.ts
git commit -m "feat(ui): add two-factor setup service"
```

## Task 7: Build account settings, QR setup, and backup-code completion

**Files:**
- Create: `ui/src/app/account-settings/account-settings.component.ts`
- Create: `ui/src/app/account-settings/account-settings.component.html`
- Create: `ui/src/app/account-settings/account-settings.component.spec.ts`

- [ ] **Step 1: Write failing account-settings tests**

Mock `TwoFactorService`, CDK `Clipboard`, `AppStore`, `Router`, and `URL.createObjectURL`/`URL.revokeObjectURL`. Cover:

- initial state renders `2FA aktivieren`;
- start shows loading, requests the QR blob, creates an object URL, and renders the image;
- a QR error shows a retry action;
- the confirmation form accepts exactly six digits;
- `400` keeps the QR step, clears the code, and shows an error;
- `401` calls `store.requireReauthentication(router.url)`;
- success renders every backup code once;
- copy joins codes with newlines and reports the CDK clipboard result;
- the download anchor has a short-lived `blob:` URL and `download="ladon-2fa-backup-codes.txt"`;
- completion stays disabled until `Validators.requiredTrue` passes;
- acknowledgement clears codes/URLs, leaves the component explicitly in the local `complete` state, renders a success confirmation, and does not return to `start`;
- replacement and destruction revoke QR and download object URLs.

- [ ] **Step 2: Run the focused component test**

```bash
npm test -w @ladon/ui -- --watch=false --browsers=ChromeHeadless --include='src/app/account-settings/account-settings.component.spec.ts'
```

Expected: FAIL because the component is absent.

- [ ] **Step 3: Implement the local state machine**

Use:

```ts
type SetupStep = 'start' | 'loading' | 'verify' | 'backup' | 'complete';

readonly step = signal<SetupStep>('start');
readonly errorMessage = signal<string | null>(null);
readonly qrCodeUrl = signal<string | null>(null);
readonly backupCodes = signal<readonly string[]>([]);
readonly backupDownloadUrl = signal<string | null>(null);
readonly copySucceeded = signal<boolean | null>(null);
```

Declare `changeDetection: ChangeDetectionStrategy.OnPush` in the standalone component metadata. Use two non-nullable reactive forms: one with the six-digit code validator and one with `savedSafely: [false, Validators.requiredTrue]`.

Use `takeUntilDestroyed()` for subscriptions. Centralize URL cleanup in small private methods. On confirm success, create the download Blob from a heading plus newline-separated codes and transition to `backup`. On acknowledgement, clear code arrays and object URLs before setting `complete`.

For an error, inspect the normalized `FetchApiError.status`. Route `401` through `AppStore.requireReauthentication(this.#router.url)`; otherwise use the normalized reason/message with a stable German fallback.

- [ ] **Step 4: Implement the Tailwind/DaisyUI template**

Use a centered max-width page, a `card bg-base-100 shadow-xl`, and a four-step `steps` indicator for activation. Render each state with native `@switch`/`@case`:

- start: explanation and primary button;
- loading: `loading loading-spinner` with a polite live region;
- verify: QR `<img>` with descriptive alt text, instructions, code input, confirm and retry/cancel controls;
- backup: warning `alert`, responsive code grid, `Alle kopieren`, bound download `<a>`, acknowledgement checkbox, finish button;
- complete: `alert alert-success` for the rest of the page visit.

Use visible labels, `aria-live` for request feedback, and no secret values in debugging attributes.

- [ ] **Step 5: Run component and service tests**

```bash
npm test -w @ladon/ui -- --watch=false --browsers=ChromeHeadless \
  --include='src/app/account-settings/account-settings.component.spec.ts' \
  --include='src/app/services/two-factor.service.spec.ts'
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add ui/src/app/account-settings ui/src/app/services/two-factor.service.ts ui/src/app/services/two-factor.service.spec.ts
git commit -m "feat(ui): add two-factor activation flow"
```

## Task 8: Wire routing, avatar navigation, and Rapids exposure

**Files:**
- Modify: `ui/src/app/app.routes.ts`
- Modify: `ui/src/app/app.routes.spec.ts`
- Modify: `ui/src/app/avatar/avatar.component.ts`
- Modify: `ui/src/app/avatar/avatar.component.html`
- Modify: `ui/src/app/avatar/avatar.component.spec.ts`
- Modify: `ui/src/app/rapidweb/rapid-runtime-facade.service.spec.ts`

- [ ] **Step 1: Write failing route and navigation tests**

Add route assertions that `setNavigationDefinitions([])` includes exactly one account-settings path and that it uses `AuthGuard` plus lazy `loadComponent`.

In `avatar.component.spec.ts`, provide a router and assert the `Kontoeinstellungen` anchor resolves to:

```text
/ui/draco/ladon-core/account-settings
```

In `rapid-runtime-facade.service.spec.ts`, add:

```ts
it('exposes the generated two-factor API to Rapids', () => {
  const facade = service.install();
  expect((facade.fetchClient as typeof fetchClient).TwoFactorAuthenticationApi).toBe(
    fetchClient.TwoFactorAuthenticationApi,
  );
});
```

- [ ] **Step 2: Run the three focused test files**

```bash
npm test -w @ladon/ui -- --watch=false --browsers=ChromeHeadless \
  --include='src/app/app.routes.spec.ts' \
  --include='src/app/avatar/avatar.component.spec.ts' \
  --include='src/app/rapidweb/rapid-runtime-facade.service.spec.ts'
```

Expected: FAIL because the route/link and generated facade assertion are not wired.

- [ ] **Step 3: Add the guarded lazy route**

In `app.routes.ts` add:

```ts
const accountRoutes: Routes = [
  {
    path: `${environment.baseHref}/account-settings`,
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./account-settings/account-settings.component').then((module) => module.AccountSettingsComponent),
  },
];
```

Include it before the wildcard route.

- [ ] **Step 4: Make the existing avatar item a real router link**

Import `RouterLink`, expose:

```ts
readonly accountSettingsUrl = `/${environment.baseHref}/account-settings`;
```

Bind `[routerLink]="accountSettingsUrl"` to the existing `Kontoeinstellungen` anchor. Do not add a second menu item.

- [ ] **Step 5: Re-run focused tests**

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add ui/src/app/app.routes.ts ui/src/app/app.routes.spec.ts ui/src/app/avatar ui/src/app/rapidweb/rapid-runtime-facade.service.spec.ts
git commit -m "feat(ui): route account settings and expose 2fa to rapids"
```

## Task 9: Full verification and security review

**Files:**
- Modify only files required by failures found in this task.

Use `@superpowers:verification-before-completion` before reporting success.

- [ ] **Step 1: Format touched UI sources**

Run Prettier directly with the UI package configuration and explicit root-relative paths. Do not use the workspace `prettier:format` script because that script always expands to the complete `ui/src` and `ui/tests` trees.

```bash
npx prettier --config ui/package.json --write \
  ui/src/app/login \
  ui/src/app/account-settings \
  ui/src/app/services/auth.service.ts \
  ui/src/app/services/auth.service.spec.ts \
  ui/src/app/services/two-factor.service.ts \
  ui/src/app/services/two-factor.service.spec.ts \
  ui/src/app/services/api/fetch-api.factory.ts \
  ui/src/app/services/api/fetch-api.factory.spec.ts \
  ui/src/app/store/app.store.ts \
  ui/src/app/store/app.store.spec.ts \
  ui/src/app/app.routes.ts \
  ui/src/app/app.routes.spec.ts \
  ui/src/app/avatar \
  ui/src/app/rapidweb/rapid-runtime-facade.service.spec.ts
```

Expected: command exits `0` and only formats scoped files.

- [ ] **Step 2: Rebuild and test the shared API package**

```bash
npm run build:api
node --test api/utility/auth-static.test.mjs api/utility/two-factor-api.test.mjs
```

Expected: PASS.

- [ ] **Step 3: Run the complete Angular suite**

```bash
npm test -w @ladon/ui -- --watch=false --browsers=ChromeHeadless
```

Expected: all tests PASS with zero failures.

- [ ] **Step 4: Run the production build**

```bash
npm run build:ui
```

Expected: Angular production build succeeds and stays within configured budgets.

- [ ] **Step 5: Inspect for secret persistence and logging**

Run:

```bash
rg -n "twoFactorCode|backupCodes|otpauth|password" ui/src/app api/utility \
  --glob '*.ts' --glob '*.html' --glob '*.mjs'
rg -n "localStorage|sessionStorage|console\.(log|debug|info|warn|error)" \
  ui/src/app/login \
  ui/src/app/account-settings \
  ui/src/app/services/two-factor.service.ts \
  ui/src/app/services/auth.service.ts \
  ui/src/app/store/app.store.ts
```

Expected: secrets appear only as transient form/request fields and test fixtures; no new persistence or logging of password, TOTP, QR data, JWT, or backup codes.

- [ ] **Step 6: Review generated and working-tree diffs**

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors; `doku_login_flow.txt` remains an untouched user-owned untracked file unless the user separately asks to commit it; no unrelated files changed.

- [ ] **Step 7: Commit verification fixes, if any**

If verification required code changes, rerun the affected tests and commit only those fixes:

```bash
# Stage the exact verified files reported by `git status --short`; do not use a broad glob.
git commit -m "fix(auth): address two-factor verification findings"
```

If no files changed, do not create an empty commit.


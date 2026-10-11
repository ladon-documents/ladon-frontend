# Two-Factor Authentication Design

## Goal

Extend the existing Ladon login with optional TOTP-based two-factor authentication and add an authenticated account-settings flow for activating 2FA. The shared API contract must live in the existing `api` package so Angular and Rapids use the same generated client.

## Scope

This design includes:

- a two-step login for users whose backend account requires TOTP;
- synchronization of the existing backend 2FA contracts into the local OpenAPI specification;
- generated fetch-client models and methods in `@ladon/api`;
- a protected account-settings page reachable from the existing avatar menu;
- QR-based TOTP setup and confirmation;
- one-time presentation, copying, and text-file download of backup codes;
- unit, integration, and build verification for the API package, Angular UI, routing, and Rapids facade.

This design does not include:

- backend implementation or backend contract changes;
- querying whether 2FA is already enabled, because the backend exposes no status endpoint in the agreed scope;
- disabling or resetting 2FA;
- recovery-code login unless the backend later documents it as a supported login input;
- persistent storage of passwords, TOTP codes, QR data, or backup codes.

## Sources of Truth

The backend already implements the API. The live Swagger document at `https://cluster.mind-consulting.de/admin/swagger-ui/index.html` is authoritative for request and response contracts. `doku_login_flow.txt` documents the intended frontend flow and security expectations.

The live API additionally specifies that a successful `POST /auth/2fa/confirm` response returns ten one-time backup codes. Those codes are only returned once in clear text and therefore require a dedicated completion step in the UI.

## Architecture

### Shared API package

The implementation follows the repository's existing OpenAPI-first architecture:

1. Synchronize only the relevant authentication contracts from the live Swagger document into `spec/api.yaml`.
2. Regenerate `api/fetch-client` with the existing OpenAPI Generator configuration in `api/openapitools.json`.
3. Continue exporting the generated client and models through `api/index.ts` and `api/static.ts`.
4. Let the existing Rapids facade expose the generated additions through `window.ladonRapid.fetchClient` without creating a second handwritten REST client.

The synchronized contracts are:

- `LoginRequest.twoFactorCode?: string | null`;
- `AuthResponse` with `accessToken`, `tokenType`, and `requiresTwoFactor`;
- `TwoFactorVerificationRequest` with `code`;
- `TwoFactorConfirmResponse` with `success`, optional `message`, and `backupCodes`;
- the typed response of `POST /auth/login`;
- `POST /auth/2fa/setup/qr`, returning `image/png`;
- `POST /auth/2fa/confirm`, returning `TwoFactorConfirmResponse`.

Generated files remain generated artifacts and must not be edited manually.

### Angular API integration

`FetchApiFactory` remains the single place that configures and instantiates generated clients. The main Ladon configuration explicitly sends `credentials: 'include'` so the HttpOnly `auth_token` cookie is included consistently.

`AuthService` consumes the typed login response. It loads the current user only after a response indicates that authentication is complete. A response with `requiresTwoFactor: true` must not mark the user as authenticated or navigate into the application.

A focused `TwoFactorService` wraps the generated QR and confirmation methods for Angular. It converts the QR response to a browser `Blob`/object URL at the UI boundary and exposes the typed confirmation response. It does not persist setup data.

### State boundaries

The application store may keep non-secret authentication workflow state, such as whether a second factor is required, whether a request is pending, and an error message. It must never retain the password, TOTP code, QR contents, or backup codes.

The login component retains email and password only in its reactive form while the two-step login is active. It supplies those values to each login request and clears them after success, cancellation, or component destruction. The TOTP input is cleared after a rejected code.

The account-settings component owns its QR object URL and backup-code array locally. Both are released when replaced, when the flow completes, and when the component is destroyed.

## Login Flow

### Initial step

The login card retains the existing application styling and displays email, password, and the login action. Submitting valid credentials calls `POST /auth/login` without `twoFactorCode`.

- When `requiresTwoFactor` is false, store the returned access token using the existing compatibility mechanism, load the current user, mark authentication complete, clear form secrets, and apply the existing safe redirect behavior.
- When `requiresTwoFactor` is true, do not store an empty token, do not load the current user, and do not redirect. Transition the component into the TOTP step.
- On a `400` response, remain in the credential step and display the normalized backend message.

### TOTP step

Email and password remain in the component form but are no longer editable. The UI displays a six-digit numeric code input and changes the primary action label to `Mit 2FA anmelden`.

The input uses:

- `inputmode="numeric"`;
- `autocomplete="one-time-code"`;
- required, exact-length, and digits-only validation;
- an accessible label and validation message.

Submitting calls the same login endpoint with email, password, and `twoFactorCode`.

- A fully authenticated response follows the normal success path.
- A `400` response keeps the TOTP step open, clears and refocuses the code input, and displays the backend message or a German fallback.
- An unexpected second `requiresTwoFactor: true` response remains in the TOTP step and displays a specific workflow error.
- The `Zurück` action returns to the initial step and clears all password and code values.

## Account Settings and 2FA Activation

### Route and entry point

Add a protected account-settings route under the existing Ladon base path. The current `Kontoeinstellungen` item in the avatar menu links to that route. The route uses the existing authentication guard and remains separate from the administrative user manager.

### Visual language

The page is a standalone Angular component using the repository's shared Tailwind build and DaisyUI primitives. It reuses established components such as `card`, `steps`, `alert`, `input`, `btn`, `loading`, and `badge`. It introduces no separate styling system and no unrelated visual redesign.

The component uses OnPush change detection, reactive forms, Angular signals for local presentation state, native control flow, and accessible labels and status messages.

### Activation states

The activation UI has four local states:

1. **Start:** Explain TOTP and offer `2FA aktivieren`.
2. **Loading:** Disable duplicate actions and show a loading indicator while requesting the QR image.
3. **Connect:** Display the QR image, setup instructions, a validated six-digit code field, and `2FA bestätigen`.
4. **Backup codes:** Display the ten one-time codes with copy and download actions. Require an acknowledgement that the codes were stored safely before allowing the flow to finish.

The page intentionally does not claim to know the server's current 2FA state. A later visit starts at the activation entry point again because no status endpoint is part of the agreed scope.

### QR handling

`POST /auth/2fa/setup/qr` returns PNG data. The component displays it via a short-lived object URL. The URL is revoked whenever a replacement is loaded and during component destruction. QR data is never converted into a persisted base64 value, logged, or cached by application code.

### Confirmation and backup codes

The confirmation form calls `POST /auth/2fa/confirm` with the six-digit code. A successful response transitions to the backup-code state.

The backup-code state:

- presents all returned codes as text;
- provides `Alle kopieren` using the Clipboard API with visible success/failure feedback;
- provides `Als Textdatei herunterladen` using a short-lived client-created Blob URL;
- requires an explicit `Ich habe die Codes sicher gespeichert` acknowledgement before finishing;
- keeps codes only in component memory and clears them when the component is destroyed or the flow finishes.

After acknowledgement, the component clears the codes and shows a local success confirmation for the remainder of the current page visit. It does not return immediately to the activation entry point or imply that it queried a persistent 2FA status. A later visit still starts at the activation entry point because no status endpoint is available.

## Error Handling

The existing `FetchApiFactory` normalization remains the common error shape for Angular consumers.

- Login `400` in the credential step: show invalid-credentials feedback and do not reveal the TOTP step.
- Login `400` in the TOTP step: keep the step open, clear the TOTP value, and allow retry.
- QR or confirmation `401`: clear local authentication data and route to login with the existing safe return URL behavior.
- QR `400` or `5xx`: keep the activation page open and provide a retry action.
- Confirmation `400`: retain the QR, clear only the code, and show invalid/expired-code feedback.
- Network failure: show a general German error and a retry action.

Backend messages may be displayed after normalization, with stable German fallback text when no useful message is available. Sensitive request or response values must never appear in logs or error telemetry.

## Security

- Send browser cookies explicitly with `credentials: 'include'` for Ladon API requests.
- Never persist passwords, TOTP codes, QR data, `otpauth://` URIs, or backup codes.
- Never log secrets, JWTs, QR blobs, or backup codes.
- Do not store an empty login token when a second factor is required.
- Clear secrets on success, cancellation, and component destruction.
- Revoke every object URL created for QR images or backup-code downloads.
- Keep the account-settings route behind the existing authentication guard.
- Preserve the existing safe redirect validation after login.

## Testing Strategy

### API package

- Verify the local OpenAPI contracts match the relevant live Swagger shapes.
- Regenerate the fetch client and verify typed login, QR setup, and confirmation methods.
- Verify QR setup is generated as a binary/blob response.
- Verify `TwoFactorConfirmResponse` includes backup codes.
- Verify the configured client sends `credentials: 'include'`.
- Verify the static/Rapids API surface still exposes the generated fetch client and authentication utilities.

### Angular services and store

- Direct login without 2FA loads the current user and completes authentication.
- A 2FA-required response does not store a token, load a user, or redirect.
- A successful second login completes the existing authentication path.
- Credential and TOTP errors produce the correct non-secret state changes.
- QR setup returns usable PNG/blob data.
- Confirmation returns and preserves backup codes only for the component boundary.
- A setup `401` triggers the agreed re-authentication path.

### Angular components and routing

- Login transitions between credential and TOTP states.
- TOTP validation accepts exactly six digits.
- Error handling clears and refocuses the TOTP field.
- Back, success, and destroy paths clear sensitive form values.
- Account settings renders start, loading, QR, error, and backup-code states.
- QR and download object URLs are revoked.
- Copy and download actions expose only the returned backup codes.
- Completion remains disabled until acknowledgement.
- The account-settings route is guarded and the avatar item navigates to it.

### Verification

Run focused unit tests first, then the API build/generation, the complete Angular test suite, and a production UI build. Generated output should be reviewed to ensure changes are limited to the documented authentication contracts.

## Backward Compatibility

Users without 2FA continue through the existing single-step login. Existing consumers that omit `twoFactorCode` remain valid. The generated client additions are additive, and Rapids continue to receive the API through the existing facade.

The application continues storing the access token for compatibility with current consumers while also sending the backend's HttpOnly cookie. A `requiresTwoFactor: true` response never writes the empty access token returned by the backend.

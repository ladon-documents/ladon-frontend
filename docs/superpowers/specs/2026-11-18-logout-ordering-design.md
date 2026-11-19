# Logout Ordering Design

## Problem

The current logout flow clears the local authentication state and starts navigation to the login route before the backend logout request completes. Clearing the state swaps the authenticated and anonymous root layouts while the current protected route is still active. Routed components can therefore be initialized again and start page-specific requests or navigations that race with the login navigation. The file manager reproduces this through its statistics request and relative navigation.

The previously working implementation completed the backend logout before clearing the authentication state and navigating.

## Selected Design

Restore backend-first logout ordering while preserving a guaranteed local logout fallback:

1. Execute the backend logout while the current credentials are still available.
2. Whether the backend request succeeds or fails, cancel pending authentication work, clear all local credentials, reset the authentication state, and navigate to the login route exactly once.
3. Make the store's completion path the sole owner of local logout cleanup; `AuthService.logout()` performs only the backend request.
4. Do not change the application layout or routing architecture as part of this fix.

The cleanup and navigation belong in a completion path that runs for both success and error. Backend logout errors must not prevent local logout.

The “exactly once” guarantee applies to each invocation of the store's logout method. Coalescing repeated logout invocations is not part of this change.

## Error Handling

- A successful backend response leads to the same local cleanup and login navigation as an error.
- A backend error is consumed only after the guaranteed cleanup has run.
- Local credentials are not removed before the backend request is created, so the request can use the current bearer token and cookie.
- Pending authentication work is cancelled during final cleanup. This avoids a pending login's cancellation finalizer removing credentials before the backend logout request. The pending-login case is not covered by the “credentials remain unchanged while pending” assertion because incomplete login credentials are owned by that login operation.
- No user-facing error is required because the user must still be logged out locally when the backend is unavailable.

## Tests

Add store-level regression tests proving:

- for an established session, local credentials, authentication state, and route remain unchanged while backend logout is pending;
- after backend logout succeeds, local credentials are cleared, state is reset, and navigation goes to the login route exactly once;
- after backend logout fails, the same local cleanup and navigation still happen exactly once.
- the authentication service does not clear local credentials itself when the backend logout succeeds.

Run the affected Auth/2FA/routing suite, TypeScript and Angular compilation, and the production build.

## Out of Scope

- Replacing the two conditional root router outlets.
- Cancelling every feature-specific API request globally.
- Changing backend cookie behavior.
- Adding a logout error notification.

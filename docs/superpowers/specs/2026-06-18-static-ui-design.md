# Static UI Design

## Context

Ladon already has two related static-page surfaces:

- `static/` contains standalone HTML views and `ladon-static.mjs`, a runtime that exposes Ladon API, CSS, auth, utilities, and optional web components through `window.ladonStaticReady`.
- `ui/src/app/staticweb` contains an Angular component that can load HTML and currently attempts to inject and execute scripts from the loaded page.

The goal is to introduce Statics as a supported UI concept: simple HTML files can be added alongside fixed Angular routes such as buckets, file manager, task manager, and plugin manager. These pages may use Ladon API, shared CSS, auth, utilities, and web components.

Because Static authorship is mixed by bucket, path, and permission, script execution must be controlled by an explicit policy. Without that policy, executing stored HTML/JavaScript in the Angular origin is effectively stored XSS by design.

## Decisions

- HTML display is allowed more broadly than JavaScript execution.
- JavaScript execution is allowed only for explicitly approved Statics.
- Productive policy is server/API-authoritative.
- UI configuration may provide local development fallbacks, but it must not override a server-side denial.
- The existing `/static?page=...` mechanism remains as a legacy compatibility path.
- New Statics should use stable IDs such as `/static/:staticId`, allowing source and policy to be resolved from API/manifest data.
- The first implementation supports a policy-based dual-mode renderer.
- Existing trusted internal examples may run in same-DOM `trusted` mode.
- New or not fully trusted Statics should target a future sandboxed mode.

## Architecture And Policy Model

The Angular Static integration is a policy-based renderer, not a free HTML injection surface. Each page resolves to a `StaticDefinition` before rendering. The definition contains the HTML source, optional stable ID, trust level, script permission, and execution mode.

Conceptual shape:

```ts
interface StaticDefinition {
  id?: string;
  source: string;
  mode: 'display-only' | 'trusted';
  allowScripts: boolean;
  allowedScriptSources: 'same-origin';
}
```

Policy resolution uses explicit result states:

- `allow`: API/server approved the Static and supplied the effective policy.
- `deny`: API/server explicitly denied the Static or script execution. This is final and cannot be overridden by local UI configuration.
- `missing`: API/server has no definition for the requested Static. Local development fallback may be used only for known local UI assets.
- `legacy`: no ID-based policy exists and the request came from `?page=...`; render as `display-only` only if the source is within an approved legacy source root.
- `invalid`: the requested source or ID is malformed, external, or outside approved roots; block the page.

Resolver precedence:

| API result | Local dev fallback | Legacy source valid | Effective result |
| --- | --- | --- | --- |
| `allow` | any | any | Use API policy |
| `deny` | any | any | Block |
| `missing` | matching local fallback | any | Use local fallback policy |
| `missing` | none | yes | Render `display-only` |
| `missing` | none | no | Block |
| `invalid` | any | any | Block |

Initial render modes:

- `display-only`: Default mode. HTML is sanitized and displayed. Scripts are removed and never executed.
- `trusted`: Explicitly approved mode. HTML is rendered in the Angular DOM and JavaScript may execute under strict script-source rules.

`display-only` applies to all non-approved Statics and all legacy loads without an explicit policy. `trusted` applies only when server/API policy, or a local development fallback, explicitly approves the page.

For script-capable Statics, the renderer fails closed. If any script violates policy, the entire Static page is blocked and a policy error is shown. Partial execution is not allowed.

## Data Flow And Routing

New Statics are loaded through stable IDs, for example `/static/:staticId`. The component resolves the ID to a `StaticDefinition`, preferably via API. The existing legacy route `/static?page=<source>` remains available for compatibility, but without policy it falls back to `display-only`.

Load flow:

1. Read route parameter or legacy query parameter.
2. Resolve a `StaticDefinition` from API first.
3. Use local UI/navigation fallback only for local static examples.
4. Default legacy unresolved pages to `display-only`.
5. Load HTML as text.
6. Parse HTML and separate scripts from markup.
7. Apply policy validation.
8. Render sanitized HTML for `display-only`.
9. Render markup and execute validated scripts for `trusted`.
10. Show load, policy, or runtime errors in component state.
11. Continue dispatching existing `ladon:error:page:*` events where applicable.

Legacy `?page=` must not load arbitrary external URLs, `javascript:` URLs, or paths outside approved Static areas.

Initial approved legacy source roots:

- `/public/html/` for UI-bundled examples such as `/public/html/test.html`.
- `/static/public/` for repository static modules that are packaged as Ladon static assets.

Legacy source normalization rules:

- Accept only same-origin absolute paths beginning with one of the approved source roots, or relative paths that normalize into one of those roots.
- Resolve bare relative legacy paths such as `test.html` against `/public/html/` for compatibility with existing UI examples.
- Reject full external URLs, protocol-relative URLs, `javascript:`, `data:`, `blob:`, and other non-HTTP document/script protocols.
- Resolve `.` and `..` segments before checking roots.
- Reject normalized paths that escape the approved roots.
- Strip query and hash before root validation unless a later API-backed policy explicitly permits them.

## Runtime And JavaScript Execution

For `trusted` pages, the Angular integration should expose a runtime contract compatible with `static/ladon-static.mjs`:

```ts
window.ladonStaticReady
```

The resolved facade should expose Ladon API, utility/auth, CSS information, and web component initialization in a shape compatible with standalone static views where practical.

Minimum first-implementation facade:

```ts
interface LadonStaticFacade {
  api: typeof import('../../api/static');
  fetchClient: typeof import('../../api/static').fetchClient;
  utility: typeof import('../../api/static').utility;
  auth: typeof import('../../api/static').utility.auth;
  cssHref?: string;
  init(options?: Record<string, unknown>): Promise<LadonStaticFacade>;
}
```

The Angular runtime should set both `window.ladonStatic` and `window.ladonStaticReady` for `trusted` pages. `window.ladonStaticReady` resolves before page scripts execute so inline module scripts can use:

```html
<script type="module">
  const ladon = await window.ladonStaticReady;
</script>
```

The first implementation does not need to reproduce every asset-probing behavior from `static/ladon-static.mjs`; it must provide the facade shape above and load shared CSS/API through the Angular application context.

Scripts cannot be expected to run through Angular `[innerHTML]`. The renderer must parse the HTML, collect scripts, remove them from the markup, render the non-script markup, and then recreate validated script elements in document order.

Allowed script forms in `trusted` mode:

- Inline classic scripts.
- Inline `type="module"` scripts.
- External scripts whose resolved URL is same-origin.

Blocked script forms:

- Third-party/CDN scripts.
- External scripts with non-same-origin URLs.
- Dangerous protocols or malformed script URLs.

On page change and component destroy, injected scripts must be removed. Script errors should be logged and reflected in Static runtime state where browser behavior allows it.

`display-only` pages must not receive a usable API/auth/runtime global.

## Security And Sanitizing

Security must not rely solely on Angular `[innerHTML]` behavior. `display-only` needs an explicit sanitizing step that removes or neutralizes at least:

- `<script>`.
- Inline event handlers such as `onclick`, `onload`, and `onerror`.
- `javascript:` URLs.
- Dangerous URL protocols in `href` and `src`.
- Risky embedding elements such as `iframe`, `object`, `embed`, and `base`, unless later explicitly allowlisted.

In `trusted` mode, sanitizing is not the security boundary because approved JavaScript in the Angular origin intentionally has the authority of the logged-in user. The security boundary is the policy: explicit approval, server/API authority, same-origin script sources, and fail-closed behavior.

The code must make the trusted execution path obvious. No caller should confuse `trusted` rendering with sandboxing.

## Components

The existing `StaticwebComponent` should become a thin stateful shell. Risky behavior should move into focused, testable services:

- `StaticDefinitionResolver`: resolves route/query input into `StaticDefinition`; API first, local dev fallback second, legacy default last.
- `StaticHtmlPolicyService`: parses HTML, separates scripts, validates policy, and produces a render plan or policy error.
- `StaticHtmlSanitizer`: sanitizes `display-only` HTML. A library such as DOMPurify is preferred if adding a dependency is acceptable; otherwise the in-house sanitizer must be conservative.
- `StaticScriptRunner`: executes validated scripts in order and cleans them up on navigation or destroy.
- `StaticRuntimeFacade`: exposes the `window.ladonStaticReady` contract for `trusted` pages, aligned with the standalone runtime.

The component state should cover loading, rendered HTML, error, and current mode.

## Testing

Unit tests should cover:

- `display-only` removes `<script>` and does not execute it.
- `display-only` removes inline event handlers.
- `display-only` blocks `javascript:` URLs.
- Legacy `?page=` without policy falls back to `display-only`.
- `trusted` executes allowed inline classic scripts.
- `trusted` executes allowed inline module scripts.
- `trusted` accepts same-origin external script URLs.
- `trusted` blocks the whole Static when a script points to an external/CDN URL.
- Resolver precedence: API policy beats local UI fallback, and local fallback cannot override an API denial.

Component tests should cover loading state, error state, route/query changes, and script cleanup on destroy.

At least one browser/integration test should verify that an allowed script actually runs and a blocked external script prevents the page from rendering.

## Future Sandbox Mode

The target architecture for non-fully-trusted dynamic Statics is an iframe sandbox with a narrow message bridge. In that mode, a compatible `ladonStaticReady` facade can be exposed inside the iframe, but API calls are mediated by an allowlisted bridge instead of full access to Angular/auth/global state.

This is not required for the first implementation, but the `mode` model should leave room for it without renaming existing concepts.

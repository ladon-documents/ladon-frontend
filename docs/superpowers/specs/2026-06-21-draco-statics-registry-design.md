# Draco Statics Registry Design

## Goal

Replace hardcoded trusted static sources and `?page=` file URLs with an ID-based Static CMS model backed by the Ladon document API.

The UI should discover available Statics from the `draco-statics` document bucket, merge their navigation entries into the global navigation, and render each Static by URL ID:

```text
/ui/draco/ladon-core/static/demo
```

This keeps Angular components for complex UI modules while allowing lightweight HTML-based pages to be added through managed document content.

## Non-Goals

- Do not keep `?page=./public/html/...` as a supported Static entry point.
- Do not trust every HTML file automatically.
- Do not serve new Statics from `ui/public/html`.
- Do not let Static navigation inject arbitrary internal Angular routes or actions.
- Do not require app startup to fail when Static discovery fails.

## Storage Model

`draco-statics` is a dedicated document bucket. Each Static must live in its own top-level folder:

```text
draco-statics/
  demo/
    config.json
    navigation.json
    demo.html
    style.css
    helper.js
```

The folder name is the Static ID. A config inside `draco-statics/demo/` must use `staticId: "demo"`. Mismatches are invalid and ignored.

Static IDs use a strict ASCII grammar:

- Pattern: `^[a-z0-9][a-z0-9-]{0,62}$`
- Lowercase only.
- No slash, backslash, dot segment, URL delimiter, colon, percent encoding, whitespace, or Unicode confusables.
- The discovered folder name and `config.staticId` are compared after no normalization other than exact string equality.
- Invalid IDs are ignored before any document key is constructed.

## Static Config

Each Static folder has a required `config.json`.

Example:

```json
{
  "staticId": "demo",
  "html": "demo.html",
  "mode": "trusted",
  "allowScripts": true,
  "allowedScriptSources": "same-origin"
}
```

Validation rules:

- `staticId` is required.
- `html` is required.
- `staticId` must equal the folder name.
- `staticId` must satisfy the Static ID grammar from the storage model.
- `html` must be a simple file name in the same folder.
- `html` must not contain `/`, `\`, traversal segments, URL delimiters, protocol syntax, or encoded traversal.
- `mode` defaults to `display-only` when missing or invalid.
- `allowScripts` defaults to `false` when missing.
- JavaScript is trusted only when `mode === "trusted"` and `allowScripts === true`.
- `allowedScriptSources` defaults to `same-origin`.

The existing `draco-statics/demo/config.json` format using `id` and `source` is considered legacy sample data and should be migrated to the new format. Phase 1 should not accept both formats.

## Static Navigation

Each Static folder may have one `navigation.json`. It is a single object, not an array.

Example:

```json
{
  "id": "static:demo",
  "label": "Authenticated Demo",
  "target": "static",
  "component": "Staticweb",
  "path": "demo",
  "icon": "heroGlobeAlt",
  "type": "main",
  "index": 35
}
```

Validation rules:

- `id` is optional in source JSON. If omitted, the registry generates `static:<staticId>`.
- `target` must be `static`.
- `path` must equal the Static ID.
- `component`, if present, must equal `Staticweb`. The dynamic route builder must ignore it for Static entries.
- Allowed fields are `id`, `label`, `target`, `component`, `path`, `icon`, `type`, and `index`.
- `label` must be a non-empty string.
- `icon`, if present, must be a string.
- `type`, if present, must be a string accepted by the existing navigation UI.
- `index`, if present, must be a finite number; missing index sorts after indexed global entries.
- One navigation entry per Static in Phase 1.
- Static navigation must not introduce `internal`, `external`, `action`, `hasChildren`, or arbitrary Angular routes.
- Unknown fields are rejected in Phase 1.
- Invalid navigation entries are ignored, but the Static can still be renderable by direct ID URL if its config is valid.

## Discovery

Discovery runs after Angular bootstrap and only once the app is authenticated.

Flow:

1. Global `public/navigation.json` remains the initial navigation source.
2. A startup orchestrator observes authentication state.
3. Once authenticated, it asks a Static registry service to discover `draco-statics`.
4. Discovery uses `DocumentsApi.listDocuments` against bucket `draco-statics`.
5. Phase 1 uses the available list API with prefix/limit/pagination where possible, then client-side filters document keys ending in `/config.json`.
6. For each valid config, the service loads `config.json`.
7. For each valid Static folder, the service attempts to load `navigation.json`.
8. Valid Static navigation entries are appended to global navigation.

Discovery is fail-soft:

- If the document API is unavailable, the app keeps the global navigation.
- If one Static folder is invalid, it is skipped.
- Invalid JSON is skipped and logged.
- Missing `navigation.json` does not block direct rendering by `/static/:staticId`.

Registry state is explicit:

- `idle`: discovery has not started.
- `loading`: discovery is running.
- `ready`: discovery completed successfully, even if some folders were skipped.
- `failed`: discovery failed globally, for example because the API is unavailable.

Direct route rendering must not treat an ID as unknown while the registry is `idle` or `loading`. `StaticwebComponent` waits for discovery to settle before resolving `/static/:staticId`. If discovery is `failed`, direct rendering may attempt an on-demand lookup for `draco-statics/<staticId>/config.json`; if that lookup fails, it shows the error state. This prevents deep links such as `/static/demo` from racing startup discovery.

## Navigation Merge

A `NavigationStore` or equivalent navigation service replaces direct UI reads from `environment.navigation`.

Responsibilities:

- Hold global navigation as the initial state.
- Append discovered Static navigation entries after authentication.
- Sort by `index`.
- For equal `index`, global entries come before Static entries.
- Static entries with equal `index` are sorted alphabetically by label or Static ID.
- Duplicate global navigation IDs win over Static navigation IDs.
- Duplicate Static navigation IDs keep the first valid Static entry and ignore later ones.
- Duplicate detection uses the normalized generated/effective navigation `id`. If no source ID exists, `static:<staticId>` is used.

Routes remain static. There is one generic Static route:

```ts
{ path: `${environment.baseHref}/static/:staticId`, component: StaticwebComponent, canActivate: [AuthGuard] }
```

Dynamic per-Static routes are not generated.

## Rendering

`StaticDefinitionResolver` resolves `staticId` against the registry.

Behavior:

- Unknown ID returns an error result.
- Unknown ID must not trigger an HTML file load.
- If registry discovery is still pending, rendering waits for registry readiness or on-demand lookup as described in Discovery.
- Valid config produces a `StaticDefinition`.
- `display-only` Statics are sanitized and scripts are not executed.
- `trusted` Statics execute JavaScript only when `mode === "trusted"` and `allowScripts === true`.

HTML is loaded through `DocumentsApi.getDocument` from bucket `draco-statics`.

Example:

```ts
documentsApi.getDocument({
  bucket: 'draco-statics',
  key: 'demo/demo.html'
})
```

The returned blob is converted to text before policy parsing and rendering.

The old `?page=` resolver path is removed or blocked. Existing navigation entries using `./public/html/...` must be migrated.

## Asset Rewriting

Static HTML can reference assets relative to its folder:

```html
<script src="./helper.js"></script>
<link rel="stylesheet" href="./style.css">
<img src="./image.png">
```

A dedicated `StaticAssetUrlService` rewrites relative URLs to browser-accessible document download URLs for the same Static folder.

The service must centralize path validation and URL construction.

Rules:

- Relative asset paths are resolved relative to the Static folder.
- Asset paths must stay inside the same folder.
- Traversal via `../`, encoded traversal, backslashes, URL delimiters, and protocol syntax are rejected.
- External script URLs remain blocked by script policy.
- Same-origin document download URLs may be used for trusted external scripts if the policy allows same-origin scripts.

Pipeline:

1. Load HTML blob through `DocumentsApi.getDocument`.
2. Convert blob to text.
3. Parse inertly.
4. Rewrite relative asset URLs for the allowed attributes.
5. Run HTML policy validation on the rewritten document.
6. For `display-only`, sanitize rewritten markup and return no scripts.
7. For `trusted`, validate scripts after rewriting, then extract and execute the validated descriptors.

Covered attributes in Phase 1:

- `script[src]`
- `link[href]` for stylesheets
- `img[src]`
- `source[src]`
- `video[src]`
- `audio[src]`

The Phase 1 browser URL is based on the generated fetch client endpoint:

```text
/admin/api/rest/v1/content/buckets/draco-statics/documents?key=<encoded-key>
```

`<encoded-key>` is the exact document key such as `demo/style.css`, encoded as a query parameter value. The endpoint must use the same authenticated browser session/cookie behavior as the existing `/admin` document API. If this URL is not browser-accessible for `script`, `link`, and media tags, implementation must stop and add/require a backend-served asset URL before enabling asset rewriting for those tags.

## Security Model

Default behavior is safe:

- Missing or invalid policy means `display-only`.
- `trusted` requires both `mode: "trusted"` and `allowScripts: true`.
- Content authors may edit HTML/CSS/JS, but must not be able to edit `config.json` or `navigation.json` in Phase 1 unless they are trusted administrators.
- The document/backend permission model must enforce this separation. Client-side checks are defense-in-depth only and are not the trust boundary.
- If the backend cannot enforce admin-only writes for `config.json`, trusted script execution from `draco-statics` must remain disabled and all discovered Statics must resolve as `display-only`.
- Static navigation cannot add arbitrary app navigation targets.
- Static IDs must match folder names.
- Duplicate or invalid entries are ignored and logged.
- Renderer never treats unknown files as trusted based on location alone.

## Error Handling

Discovery:

- Log invalid configs/navigation.
- Skip broken Statics.
- Keep app usable with global navigation.

Rendering:

- Unknown Static ID shows component error state.
- Pending discovery shows loading state instead of unknown-ID error.
- Failed discovery logs a warning and may attempt on-demand config lookup for direct Static routes.
- Missing HTML shows component error state.
- Policy validation failures show component error state and do not run scripts.
- Runtime/script cleanup runs before showing errors.

## Testing Strategy

Unit tests:

- Config parsing and validation.
- Static ID equals folder validation.
- Static ID grammar validation.
- Display-only defaults.
- Trusted requires `mode` and `allowScripts`.
- Invalid HTML paths are rejected.
- Navigation validation allows only `target: "static"` and matching `path`.
- Merge ordering and duplicate behavior.
- Generated `static:<staticId>` navigation IDs.
- Registry lookup by ID.
- Pending discovery does not produce false unknown-ID errors.
- Unknown ID error handling.
- Asset URL rewriting blocks traversal and external script URLs and rewrites before script policy validation.

Component/integration tests:

- `/static/demo` resolves through registry and loads `demo/demo.html`.
- Unknown `/static/missing` renders an error and does not call `getDocument`.
- Trusted Static runs allowed inline JavaScript.
- Display-only Static strips scripts.
- Relative same-folder asset URLs are rewritten.
- Broken Static discovery does not break global navigation.
- Direct `/static/demo` deep link waits for registry readiness or on-demand lookup.

## Migration

1. Migrate existing Static navigation entries away from `?page=` and `./public/html/...`.
2. Move Static examples from `ui/public/html` to `draco-statics/<staticId>/`.
3. Migrate `draco-statics/demo/config.json` from `id/source` to `staticId/html`.
4. Migrate `draco-statics/demo/navigation.json` from `path: "authenticated"` to `path: "demo"` and add or generate `id: "static:demo"`.
5. Use `/static/<staticId>` links in navigation.
6. Remove `localTrustedSources` once registry-backed policy is active.

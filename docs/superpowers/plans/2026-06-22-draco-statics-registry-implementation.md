# Draco Statics Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded UI Static file paths with an authenticated `draco-statics` document-bucket registry that renders `/static/:staticId` pages and merges per-Static navigation.

**Architecture:** Add a registry layer under `ui/src/app/staticweb/` that validates `config.json` and `navigation.json`, discovers Statics through `DocumentsApi`, and exposes lookup state to `StaticwebComponent`. Add a navigation state service so global navigation can render immediately and Static navigation can be appended after authentication. Keep HTML policy, runtime facade, and script runner focused; add asset URL rewriting before policy validation.

**Tech Stack:** Angular 19 standalone components, RxJS, NgRx signal store already present through `AppStore`, generated `@ladon/api` fetch client, Jasmine/Karma unit tests, strict TypeScript.

---

## Reference Documents

- Spec: `docs/superpowers/specs/2026-06-21-draco-statics-registry-design.md`
- Existing Static renderer: `ui/src/app/staticweb/`
- Existing navigation bootstrap: `ui/src/main.ts`, `ui/src/app/app.navconfig.ts`, `ui/src/app/app.component.ts`
- Existing router helper: `ui/src/app/services/ladon-router.service.ts`
- Existing API factory: `ui/src/app/services/api/fetch-api.factory.ts`
- Existing document API endpoint in generated client: `api/fetch-client/apis/DocumentsApi.ts`

## File Structure

- Create `ui/src/app/staticweb/draco-static.types.ts`
  - Shared config, registry, validation, and discovery state types.
- Create `ui/src/app/staticweb/static-trust-boundary.service.ts`
  - Central runtime gate for whether `draco-statics` configs may enable trusted scripts.
- Create `ui/src/app/staticweb/draco-static-config.service.ts`
  - Parse and validate `config.json` and per-Static `navigation.json`.
- Create `ui/src/app/staticweb/static-asset-url.service.ts`
  - Validate same-folder asset paths and build `/admin/api/rest/v1/content/buckets/draco-statics/documents?key=...` URLs.
- Create `ui/src/app/staticweb/static-asset-rewriter.service.ts`
  - Inertly parse HTML and rewrite allowed relative asset attributes before policy validation.
- Create `ui/src/app/staticweb/draco-static-registry.service.ts`
  - Discover `draco-statics`, load configs/navigation, expose registry state, and provide on-demand lookup.
- Modify `ui/src/app/staticweb/static-html-policy.service.ts`
  - Accept pre-rewritten HTML and preserve trusted script behavior.
- Modify `ui/src/app/staticweb/static-definition.resolver.ts`
  - Resolve `staticId` through the registry instead of `localTrustedSources` and `?page=`.
- Modify `ui/src/app/staticweb/staticweb.component.ts`
  - Use route param `staticId`, wait for registry readiness, load HTML through document API, rewrite assets, render via policy.
- Modify `ui/src/app/staticweb/staticweb.component.html`
  - Keep loading/error/content states; ensure pending discovery shows loading.
- Create `ui/src/app/navigation/navigation-store.service.ts`
  - Hold global + Static navigation as reactive state.
- Modify `ui/src/app/app.component.ts`
  - Read navigation from the store and trigger Static discovery after authentication.
- Modify `ui/src/app/services/ladon-router.service.ts`
  - Read navigation from the store instead of captured `environment.navigation`.
- Modify `ui/src/app/app.routes.ts`
  - Rename route param to `staticId`, block old query-page usage in Static component tests.
- Modify `draco-statics/demo/config.json`
  - Migrate sample config to new `staticId/html` format.
- Modify `draco-statics/demo/navigation.json`
  - Migrate sample navigation path to `demo`.
- Add/update focused specs next to each new service.

## Verification Commands

Use this Node setup for all npm commands:

```bash
PATH=/Users/merihguerlek/.nvm/versions/node/v24.14.0/bin:$PATH NPM_USER_BASE64=dummy npm run build
```

Focused Karma commands may still compile unrelated broken specs in this repo. Run them anyway and document whether failures are unrelated global spec failures:

```bash
PATH=/Users/merihguerlek/.nvm/versions/node/v24.14.0/bin:$PATH NPM_USER_BASE64=dummy npm run test -- --include=src/app/staticweb/draco-static-config.service.spec.ts --watch=false --browsers=ChromeHeadless
PATH=/Users/merihguerlek/.nvm/versions/node/v24.14.0/bin:$PATH NPM_USER_BASE64=dummy npm run test -- --include=src/app/staticweb/static-asset-url.service.spec.ts --watch=false --browsers=ChromeHeadless
PATH=/Users/merihguerlek/.nvm/versions/node/v24.14.0/bin:$PATH NPM_USER_BASE64=dummy npm run test -- --include=src/app/staticweb/draco-static-registry.service.spec.ts --watch=false --browsers=ChromeHeadless
PATH=/Users/merihguerlek/.nvm/versions/node/v24.14.0/bin:$PATH NPM_USER_BASE64=dummy npm run test -- --include=src/app/staticweb/staticweb.component.spec.ts --watch=false --browsers=ChromeHeadless
```

Before final completion:

```bash
PATH=/Users/merihguerlek/.nvm/versions/node/v24.14.0/bin:$PATH NPM_USER_BASE64=dummy npm run build
PATH=/Users/merihguerlek/.nvm/versions/node/v24.14.0/bin:$PATH NPM_USER_BASE64=dummy npm run test -- --include='src/app/staticweb/**/*.spec.ts' --watch=false --browsers=ChromeHeadless
```

## Task 0: Trust Boundary Gate

**Files:**
- Create: `ui/src/app/staticweb/static-trust-boundary.service.ts`
- Create: `ui/src/app/staticweb/static-trust-boundary.service.spec.ts`
- Modify: environment files only if an existing environment/config pattern is available

- [ ] **Step 1: Write failing tests**

Cover:

```ts
it('disables trusted static scripts by default when no backend trust guarantee is configured', () => {});
it('allows trusted static scripts only when the runtime trust boundary is explicitly enabled', () => {});
it('documents that client checks are not the trust boundary', () => {});
```

- [ ] **Step 2: Implement gate**

Implement a small injectable service that answers whether `config.json` may enable trusted scripts. Use an existing environment/runtime configuration pattern if present; otherwise default to `false` and expose one clearly named internal constant or injection token for tests.

Security requirement:

- Trusted JavaScript from `draco-statics` is enabled only when the backend/document permission model enforces admin-only writes for `config.json` and `navigation.json`.
- If that guarantee cannot be verified in this frontend repository, the gate must return disabled by default and every discovered Static is downgraded to `display-only`, even if `config.json` says `mode: "trusted"` and `allowScripts: true`.
- This service is a runtime safety gate, not the trust boundary itself.

- [ ] **Step 3: Run tests and build**

Run the focused trust-boundary spec and build.

- [ ] **Step 4: Commit**

```bash
git add ui/src/app/staticweb/static-trust-boundary.service.ts ui/src/app/staticweb/static-trust-boundary.service.spec.ts
git commit -m "feat(static): gate trusted static execution"
```

## Task 1: Draco Static Types

**Files:**
- Create: `ui/src/app/staticweb/draco-static.types.ts`

- [ ] **Step 1: Add shared types**

Create interfaces:

```ts
import { NavigationEntry } from '../interfaces/navigation-entry';
import { StaticDefinition } from './staticweb.types';

export type DracoStaticDiscoveryState = 'idle' | 'loading' | 'ready' | 'failed';
export type DracoStaticMode = 'display-only' | 'trusted';

export interface DracoStaticConfigJson {
  staticId?: unknown;
  html?: unknown;
  mode?: unknown;
  allowScripts?: unknown;
  allowedScriptSources?: unknown;
}

export interface DracoStaticNavigationJson {
  id?: unknown;
  label?: unknown;
  target?: unknown;
  component?: unknown;
  path?: unknown;
  icon?: unknown;
  type?: unknown;
  index?: unknown;
}

export interface DracoStaticEntry {
  staticId: string;
  bucket: 'draco-statics';
  basePath: string;
  html: string;
  htmlKey: string;
  mode: DracoStaticMode;
  allowScripts: boolean;
  allowedScriptSources: 'same-origin';
  definition: StaticDefinition;
  navigation?: NavigationEntry;
}

export interface DracoStaticRegistrySnapshot {
  state: DracoStaticDiscoveryState;
  entries: DracoStaticEntry[];
  byId: ReadonlyMap<string, DracoStaticEntry>;
  error?: string;
}
```

- [ ] **Step 2: Run build**

Run:

```bash
PATH=/Users/merihguerlek/.nvm/versions/node/v24.14.0/bin:$PATH NPM_USER_BASE64=dummy npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add ui/src/app/staticweb/draco-static.types.ts
git commit -m "feat(static): add draco static registry types"
```

## Task 2: Config And Navigation Validation

**Files:**
- Create: `ui/src/app/staticweb/draco-static-config.service.ts`
- Create: `ui/src/app/staticweb/draco-static-config.service.spec.ts`

- [ ] **Step 1: Write failing tests**

Cover:

```ts
it('accepts a valid config whose static id matches the folder', () => {});
it('defaults missing policy fields to display-only', () => {});
it('rejects a static id that does not match the folder', () => {});
it('rejects static ids outside the strict grammar', () => {});
it('rejects html paths with slashes or traversal', () => {});
it('normalizes trusted only when mode trusted and allowScripts true', () => {});
it('accepts valid static navigation and generates id when missing', () => {});
it('rejects navigation id that differs from static:<staticId>', () => {});
it('rejects navigation entries whose path differs from the static id', () => {});
it('rejects navigation entries with missing or blank labels', () => {});
it('rejects navigation entries with non-static targets', () => {});
it('rejects navigation component values other than Staticweb', () => {});
it('rejects navigation entries with unsupported type values', () => {});
it('rejects navigation entries with non-finite index values', () => {});
it('rejects unknown navigation fields', () => {});
it('keeps a valid static renderable when navigation is invalid', () => {});
it('downgrades trusted config to display-only when the trust boundary gate is disabled', () => {});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
PATH=/Users/merihguerlek/.nvm/versions/node/v24.14.0/bin:$PATH NPM_USER_BASE64=dummy npm run test -- --include=src/app/staticweb/draco-static-config.service.spec.ts --watch=false --browsers=ChromeHeadless
```

Expected: FAIL because service does not exist.

- [ ] **Step 3: Implement validator**

Implement:

- `parseConfig(folderName: string, raw: unknown): DracoStaticEntry`
- `parseNavigation(staticId: string, raw: unknown): NavigationEntry | undefined`
- `STATIC_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/`
- `html` must match `^[A-Za-z0-9][A-Za-z0-9._-]*\\.html$` and must not include path separators or percent encoding.
- `mode` defaults to `display-only`.
- `allowScripts` defaults to `false`.
- trusted definition only when `mode === 'trusted' && allowScripts === true && StaticTrustBoundaryService.trustedStaticScriptsEnabled()`.
- When the trust gate is disabled, preserve the Static entry but normalize its definition to `display-only` with `allowScripts: false`.
- generated/effective navigation ID is `static:${staticId}`.
- navigation `path` must exactly equal `staticId`.
- navigation `label` must be a non-empty string.
- navigation `target` must equal `static`.
- navigation `component`, if present, must equal `Staticweb`; the route builder must not use it to create arbitrary routes.
- navigation `type`, if present, must be one of the existing accepted `NavigationEntryType` values.
- navigation `index`, if present, must be a finite number.
- unknown navigation fields are invalid.
- invalid navigation returns `undefined`; it must not invalidate an otherwise valid Static config.

- [ ] **Step 4: Run test and build**

Run focused test and build. Expected: Static-specific compile passes; global Karma may still fail on unrelated specs.

- [ ] **Step 5: Commit**

```bash
git add ui/src/app/staticweb/draco-static-config.service.ts ui/src/app/staticweb/draco-static-config.service.spec.ts
git commit -m "feat(static): validate draco static config"
```

## Task 3: Asset URL Builder And Rewriter

**Files:**
- Create: `ui/src/app/staticweb/static-asset-url.service.ts`
- Create: `ui/src/app/staticweb/static-asset-url.service.spec.ts`
- Create: `ui/src/app/staticweb/static-asset-rewriter.service.ts`
- Create: `ui/src/app/staticweb/static-asset-rewriter.service.spec.ts`

- [ ] **Step 1: Write failing URL builder tests**

Cover:

```ts
it('builds document content urls for same-folder assets', () => {});
it('encodes keys as query parameter values', () => {});
it('rejects traversal paths', () => {});
it('rejects encoded traversal and encoded separators', () => {});
it('rejects protocol and protocol-relative paths', () => {});
it('rejects raw backslashes in asset paths', () => {});
it('rejects query strings and fragments in relative asset paths', () => {});
it('documents the browser asset endpoint that must be verified before enabling tag rewriting', () => {});
```

- [ ] **Step 2: Verify browser asset endpoint**

Before enabling URL rewriting for executable or browser-loaded tags, verify locally against existing API conventions that this URL is browser-accessible with the authenticated `/admin` session for `script`, `link`, and media tags:

```text
/admin/api/rest/v1/content/buckets/draco-statics/documents?key=<encoded-key>
```

If the endpoint is not usable by browser tags, stop this task and add/require a backend-served asset URL first. Do not fake the browser URL by using `DocumentsApi.getDocument` object URLs for scripts; that would change script origin and policy behavior.

- [ ] **Step 3: Implement URL builder**

Use endpoint:

```text
/admin/api/rest/v1/content/buckets/draco-statics/documents?key=<encoded-key>
```

For `staticId = demo`, `basePath = demo/`, `assetPath = ./style.css`, output:

```text
/admin/api/rest/v1/content/buckets/draco-statics/documents?key=demo%2Fstyle.css
```

- [ ] **Step 4: Write failing rewriter tests**

Cover:

```ts
it('rewrites script src before policy validation', () => {});
it('rewrites stylesheet link href', () => {});
it('rewrites image and media src attributes', () => {});
it('leaves hash-only and empty values alone where appropriate', () => {});
it('throws when a relative asset escapes the static folder', () => {});
it('leaves external non-script urls for sanitizer/policy to decide', () => {});
it('does not rewrite external script src values and leaves them for policy rejection', () => {});
it('rejects script src values with backslashes, queries, or fragments', () => {});
```

- [ ] **Step 5: Implement rewriter**

Use inert `<template>` parsing. Rewrite attributes:

- `script[src]`
- `link[href]` when `rel` includes `stylesheet`
- `img[src]`
- `source[src]`
- `video[src]`
- `audio[src]`

Return rewritten HTML string.

Asset path validation requirements:

- Reject raw backslashes, URL delimiters (`?`, `#`), protocol syntax, protocol-relative URLs, traversal, encoded traversal, and encoded separators for relative assets.
- External `script[src]` values must not become executable through rewriting. Leave them unchanged so `StaticHtmlPolicyService` / `StaticUrlPolicyService` rejects them, or throw before planning; either behavior must prevent execution.

- [ ] **Step 6: Run tests and build**

Run both focused specs and build.

- [ ] **Step 7: Commit**

```bash
git add ui/src/app/staticweb/static-asset-url.service.ts ui/src/app/staticweb/static-asset-url.service.spec.ts ui/src/app/staticweb/static-asset-rewriter.service.ts ui/src/app/staticweb/static-asset-rewriter.service.spec.ts
git commit -m "feat(static): rewrite draco static asset urls"
```

## Task 4: Draco Static Registry Discovery

**Files:**
- Create: `ui/src/app/staticweb/draco-static-registry.service.ts`
- Create: `ui/src/app/staticweb/draco-static-registry.service.spec.ts`

- [ ] **Step 1: Write failing tests**

Mock `FetchApiFactory.documentsApi`.

Cover:

```ts
it('starts idle and exposes an empty snapshot', () => {});
it('discovers config files from draco-statics documentlist', async () => {});
it('loads valid config and optional navigation json', async () => {});
it('skips invalid config and keeps discovery fail-soft', async () => {});
it('sets state failed when documentlist fails', async () => {});
it('does not duplicate concurrent discovery requests', async () => {});
it('looks up static entries by id', async () => {});
it('performs on-demand lookup after failed discovery', async () => {});
it('paginates document listing until the final short page', async () => {});
it('keeps the first valid static when duplicate static ids are discovered', async () => {});
it('rejects invalid on-demand static ids before constructing document keys', async () => {});
it('skips listed invalid config keys before loading config documents', async () => {});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL because registry service does not exist.

- [ ] **Step 3: Implement registry**

Implementation requirements:

- Bucket constant: `draco-statics`.
- Validate any discovered folder name and any route/on-demand `staticId` with the shared `STATIC_ID_PATTERN` before constructing document keys.
- Invalid IDs such as `../x`, encoded separators, colon, whitespace, uppercase, or Unicode must not call `getDocument`.
- Use `documentsApi.listDocuments({ bucket: 'draco-statics', limit: 1000, page, currentFolder: false })`.
- Loop pages until the returned document count is less than `limit`, or until generated API response metadata gives an explicit final page.
- Filter document keys ending `/config.json`.
- Derive folder name from key before `/config.json`; only top-level keys like `demo/config.json` are valid.
- Skip invalid or nested listed keys such as `nested/demo/config.json`, `Demo/config.json`, `%2e%2e/config.json`, or `bad:id/config.json` before calling `getDocument`.
- Load JSON blobs with `documentsApi.getDocument({ bucket, key })`.
- Convert blobs through `await blob.text()`.
- Parse config through `DracoStaticConfigService`.
- Load `navigation.json` for valid folders if present or attempt direct load fail-soft.
- Keep the first valid Static entry for duplicate Static IDs and ignore/log later duplicates.
- Keep `BehaviorSubject<DracoStaticRegistrySnapshot>`.
- Expose `snapshot$`, `snapshot()`, `discover(): Promise<DracoStaticRegistrySnapshot>`, `waitUntilSettled()`, `getById(id)`, `lookupOnDemand(id)`.

- [ ] **Step 4: Run tests and build**

- [ ] **Step 5: Commit**

```bash
git add ui/src/app/staticweb/draco-static-registry.service.ts ui/src/app/staticweb/draco-static-registry.service.spec.ts
git commit -m "feat(static): discover draco static registry"
```

## Task 5: Navigation Store And Startup Discovery

**Files:**
- Create: `ui/src/app/navigation/navigation-store.service.ts`
- Create: `ui/src/app/navigation/navigation-store.service.spec.ts`
- Modify: `ui/src/app/app.component.ts`
- Modify: `ui/src/app/services/ladon-router.service.ts`

- [ ] **Step 1: Write failing navigation store tests**

Cover:

```ts
it('starts with global navigation', () => {});
it('appends static navigation sorted by index', () => {});
it('keeps global entries before static entries for equal index', () => {});
it('ignores static navigation id duplicates when global id exists', () => {});
it('keeps the first static navigation entry when duplicate static ids exist', () => {});
it('sorts missing static indexes after indexed global entries', () => {});
it('sorts static entries with same index alphabetically', () => {});
```

- [ ] **Step 2: Implement navigation store**

Use Angular injectable service with a signal or `BehaviorSubject`.

API:

```ts
readonly entries: Signal<NavigationEntry[]>;
setGlobal(entries: NavigationEntry[]): void;
setStatic(entries: NavigationEntry[]): void;
```

- [ ] **Step 3: Refactor AppComponent**

Requirements:

- Initialize global navigation in store from `environment.navigation`.
- Read navigation entries from store, not directly from environment.
- Observe authenticated state; when it becomes true, call registry `discover()` fail-soft and pass discovered navigation entries to store.
- Do not block app rendering while discovery runs.
- Pass only valid discovered navigation entries to the store.
- Missing Static `index` sorts after indexed global entries.
- Duplicate Static navigation IDs keep the first valid Static entry.

- [ ] **Step 4: Refactor LadonRouterService**

Use `NavigationStore` for `getFileManagerNavigationEntry()` instead of captured `environment.navigation`.

- [ ] **Step 5: Run tests and build**

- [ ] **Step 6: Commit**

```bash
git add ui/src/app/navigation/navigation-store.service.ts ui/src/app/navigation/navigation-store.service.spec.ts ui/src/app/app.component.ts ui/src/app/services/ladon-router.service.ts
git commit -m "feat(static): merge draco static navigation"
```

## Task 6: Static Definition Resolver By Static ID

**Files:**
- Modify: `ui/src/app/staticweb/static-definition.resolver.ts`
- Modify: `ui/src/app/staticweb/static-definition.resolver.spec.ts`
- Modify: `ui/src/app/staticweb/staticweb.types.ts` if needed

- [ ] **Step 1: Write failing tests**

Cover:

```ts
it('resolves a known static id from the registry', () => {});
it('returns missing/error for unknown static ids', () => {});
it('does not resolve legacy page query sources', () => {});
it('returns display-only when config is not trusted', () => {});
it('returns trusted only when mode trusted and allowScripts true', () => {});
it('returns display-only when trusted config is downgraded by the trust boundary gate', () => {});
it('rejects invalid static ids before registry lookup', () => {});
```

- [ ] **Step 2: Refactor resolver**

Remove `localTrustedSources` and legacy `page` fallback. Resolve `staticId` only. Validate the route `staticId` with the shared grammar before registry lookup.

- [ ] **Step 3: Run tests and build**

- [ ] **Step 4: Commit**

```bash
git add ui/src/app/staticweb/static-definition.resolver.ts ui/src/app/staticweb/static-definition.resolver.spec.ts ui/src/app/staticweb/staticweb.types.ts
git commit -m "feat(static): resolve statics by registry id"
```

## Task 7: Staticweb Component Document API Rendering

**Files:**
- Modify: `ui/src/app/staticweb/staticweb.component.ts`
- Modify: `ui/src/app/staticweb/staticweb.component.html`
- Modify: `ui/src/app/staticweb/staticweb.component.spec.ts`

- [ ] **Step 1: Write failing component tests**

Cover:

```ts
it('waits for registry loading before resolving a static id', fakeAsync(() => {}));
it('loads html from documents api for a known static id', fakeAsync(() => {}));
it('rewrites assets before creating the render plan', fakeAsync(() => {}));
it('shows error for an unknown static id without getDocument html load', fakeAsync(() => {}));
it('uses on-demand lookup when discovery failed', fakeAsync(() => {}));
it('does not accept page query rendering', fakeAsync(() => {}));
it('does not construct document keys for invalid route ids', fakeAsync(() => {}));
```

- [ ] **Step 2: Refactor component**

Requirements:

- Route param is `staticId`, not `htmlId`.
- No `page` query support.
- Validate `staticId` before registry wait, on-demand lookup, or document HTML load.
- Invalid route IDs such as `../x`, encoded separators, colon, whitespace, uppercase, or Unicode show an error and never call `getDocument`.
- Wait for registry readiness or failed/on-demand result.
- Load HTML with `FetchApiFactory.documentsApi.getDocument`.
- Convert Blob to text.
- Rewrite assets with `StaticAssetRewriterService`.
- Create render plan with `StaticHtmlPolicyService`.
- Display-only clears runtime/scripts and renders sanitized HTML.
- Trusted installs runtime, renders plan HTML, awaits `StaticScriptRunnerService.run`.
- Errors clear runtime/scripts/content and show error.

- [ ] **Step 3: Run tests and build**

- [ ] **Step 4: Commit**

```bash
git add ui/src/app/staticweb/staticweb.component.ts ui/src/app/staticweb/staticweb.component.html ui/src/app/staticweb/staticweb.component.spec.ts
git commit -m "feat(static): render draco statics from documents"
```

## Task 8: Routes And Legacy Removal

**Files:**
- Modify: `ui/src/app/app.routes.ts`
- Modify: `ui/public/navigation.json`
- Modify: `draco-statics/demo/config.json`
- Modify: `draco-statics/demo/navigation.json`

- [ ] **Step 1: Write/adjust route tests if present**

Search for route specs. If none exist, ensure component/resolver specs cover route param behavior and the absence of the legacy bare `static` route.

- [ ] **Step 2: Rename route param**

Change:

```ts
static/:htmlId
```

to:

```ts
static/:staticId
```

- [ ] **Step 3: Remove or explicitly block legacy bare Static route**

There must be one generic Static route: `static/:staticId`. Remove the existing bare `static` route if present. If Angular routing requires a compatibility entry, it must redirect to an error/landing state and must not render `?page=` sources.

- [ ] **Step 4: Migrate global navigation**

Remove old Static entries using `./public/html/...`. Use `path: "demo"` only if global navigation should include the sample; otherwise rely on discovered `draco-statics/demo/navigation.json`.

- [ ] **Step 5: Migrate demo files**

Change `draco-statics/demo/config.json` to:

```json
{
  "staticId": "demo",
  "html": "demo.html",
  "mode": "trusted",
  "allowScripts": true,
  "allowedScriptSources": "same-origin"
}
```

Change `draco-statics/demo/navigation.json` to:

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

- [ ] **Step 6: Run build**

- [ ] **Step 7: Commit**

```bash
git add ui/src/app/app.routes.ts ui/public/navigation.json draco-statics/demo/config.json draco-statics/demo/navigation.json
git commit -m "feat(static): migrate static routes to ids"
```

## Task 9: Integration Coverage

**Files:**
- Modify/Create: `ui/src/app/staticweb/staticweb.integration.spec.ts`

- [ ] **Step 1: Write integration tests**

Cover:

```ts
it('renders /static/demo through registry and document html', fakeAsync(() => {}));
it('runs trusted inline script from draco static html when the trust gate is enabled', fakeAsync(() => {}));
it('does not run trusted script config when the trust gate is disabled', fakeAsync(() => {}));
it('blocks unknown /static/missing without document html load', fakeAsync(() => {}));
it('rewrites same-folder script src and waits for script runner', fakeAsync(() => {}));
it('keeps global navigation when discovery fails', fakeAsync(() => {}));
```

- [ ] **Step 2: Run focused integration test**

Expected: PASS or only unrelated global spec compilation failures.

- [ ] **Step 3: Run final build and static spec suite**

Run final commands from Verification section.

- [ ] **Step 4: Commit**

```bash
git add ui/src/app/staticweb/staticweb.integration.spec.ts
git commit -m "test(static): cover draco static registry integration"
```

## Task 10: Final Review And Cleanup

**Files:**
- Any files touched by small fixes from verification.

- [ ] **Step 1: Search for removed legacy concepts**

Run:

```bash
rg "localTrustedSources|\\?page=|staticHMTL|htmlId|public/html" ui/src/app/staticweb ui/public/navigation.json
```

Expected: no production references to `localTrustedSources`, `staticHMTL`, old `?page=` rendering, or Static `public/html` navigation.

- [ ] **Step 2: Verify git status**

Run:

```bash
git status --short
```

Expected: clean or only intentionally untracked files.

- [ ] **Step 3: Final build**

Run:

```bash
PATH=/Users/merihguerlek/.nvm/versions/node/v24.14.0/bin:$PATH NPM_USER_BASE64=dummy npm run build
```

Expected: PASS.

- [ ] **Step 4: Final focused tests**

Run:

```bash
PATH=/Users/merihguerlek/.nvm/versions/node/v24.14.0/bin:$PATH NPM_USER_BASE64=dummy npm run test -- --include='src/app/staticweb/**/*.spec.ts' --watch=false --browsers=ChromeHeadless
```

Expected: PASS if global spec isolation works; otherwise document unrelated global spec failures.

- [ ] **Step 5: Commit any final fixes**

```bash
git add <changed-files>
git commit -m "fix(static): finalize draco static registry"
```

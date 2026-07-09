# Pluginmanager Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Draco Pluginmanager as a store-driven Angular workbench with clear data-access, workflow, mapper, state, and presentation boundaries.

**Architecture:** Introduce typed pluginmanager view models and pure mapper functions first, then move plugin API access into a lean `PluginService`, move transaction/download/upload/deinstall orchestration into `PluginInstallationService`, and make `PluginManagerStore` the feature state source. Rebuild the UI as a two-column workbench backed by store signals.

**Tech Stack:** Angular standalone components, NgRx Signal Store, RxJS, Jasmine/Karma Angular tests, Tailwind/DaisyUI utility classes, existing `@ladon/api` Fetch API factory.

---

## Reference Documents

- Spec: `docs/superpowers/specs/2026-07-09-pluginmanager-refactor-design.md`
- Current component: `ui/src/app/pluginmanager/pluginmanager.component.ts`
- Current service: `ui/src/app/pluginmanager/services/plugin.service.ts`
- Current route: `ui/src/app/pluginmanager/pluginmanager.routes.ts`
- Existing store patterns: `ui/src/app/store/bucket.store.ts`, `ui/src/app/store/filemanager-tags.store.ts`
- Shared toast service: `ui/src/app/shared/services/toast.service.ts`

## Planned File Structure

Create:

- `ui/src/app/pluginmanager/models/pluginmanager.models.ts`
  - Owns pluginmanager UI/domain-facing types: channel, item, status, action, overview, errors.
- `ui/src/app/pluginmanager/utils/pluginmanager.mappers.ts`
  - Pure mapping and calculation functions. No Angular injection.
- `ui/src/app/pluginmanager/utils/pluginmanager.mappers.spec.ts`
  - Unit tests for version/status/deinstall/search/overview/bundle mapping.
- `ui/src/app/pluginmanager/services/plugin-installation.service.ts`
  - Owns install/update/deinstall workflows.
- `ui/src/app/pluginmanager/services/plugin-installation.service.spec.ts`
  - Unit tests for workflow success/failure boundaries.
- `ui/src/app/pluginmanager/plugin-workbench/plugin-workbench.component.ts`
- `ui/src/app/pluginmanager/plugin-workbench/plugin-workbench.component.html`
- `ui/src/app/pluginmanager/plugin-workbench/plugin-workbench.component.scss`
  - Main presentational workbench shell.
- `ui/src/app/pluginmanager/plugin-channel-nav/plugin-channel-nav.component.ts`
- `ui/src/app/pluginmanager/plugin-channel-nav/plugin-channel-nav.component.html`
- `ui/src/app/pluginmanager/plugin-channel-nav/plugin-channel-nav.component.scss`
  - Channel navigation.
- `ui/src/app/pluginmanager/plugin-search/plugin-search.component.ts`
- `ui/src/app/pluginmanager/plugin-search/plugin-search.component.html`
- `ui/src/app/pluginmanager/plugin-search/plugin-search.component.scss`
  - Local search input.
- `ui/src/app/pluginmanager/plugin-overview/plugin-overview.component.ts`
- `ui/src/app/pluginmanager/plugin-overview/plugin-overview.component.html`
- `ui/src/app/pluginmanager/plugin-overview/plugin-overview.component.scss`
  - No-selection overview panel.
- `ui/src/app/pluginmanager/plugin-detail/plugin-detail.component.ts`
- `ui/src/app/pluginmanager/plugin-detail/plugin-detail.component.html`
- `ui/src/app/pluginmanager/plugin-detail/plugin-detail.component.scss`
  - Selected plugin detail and actions.
- `ui/src/app/pluginmanager/plugin-documentation-panel/plugin-documentation-panel.component.ts`
- `ui/src/app/pluginmanager/plugin-documentation-panel/plugin-documentation-panel.component.html`
- `ui/src/app/pluginmanager/plugin-documentation-panel/plugin-documentation-panel.component.scss`
  - Documentation iframe boundary.

Modify:

- `ui/src/app/pluginmanager/services/plugin.service.ts`
  - Reduce to data-access methods.
- `ui/src/app/pluginmanager/services/plugin-meta.service.ts`
  - Keep only config/required-plugin helpers that still belong here, or move hardcoded required-plugin list into mapper config if cleaner.
- `ui/src/app/store/pluginmanager.store.ts`
  - Implement Signal Store state, computed signals, and rxMethods.
- `ui/src/app/pluginmanager/pluginmanager.component.ts`
  - Reduce to container/routing/breakpoint host for the workbench.
- `ui/src/app/pluginmanager/pluginmanager.component.html`
  - Render workbench instead of current tab/router-outlet/iframe composition.
- `ui/src/app/pluginmanager/pluginmanager.routes.ts`
  - Keep `:channelName`, but route to the container/workbench rather than using `PluginListComponent` as routed child if no longer needed.
- `ui/src/app/pluginmanager/plugin-list/plugin-list.component.ts`
- `ui/src/app/pluginmanager/plugin-list/plugin-list.component.html`
- `ui/src/app/pluginmanager/plugin-list/plugin-list.component.scss`
  - Either convert to the compact presentational list or replace it with a new workbench list component. Prefer reuse if it stays small.
- `ui/src/app/pluginmanager/pluginmanager.component.spec.ts`
- `ui/src/app/pluginmanager/plugin-list/plugin-list.component.spec.ts`
- `ui/src/app/pluginmanager/services/plugin.service.spec.ts`
  - Update for new responsibilities.

Remove only after replacement is tested:

- Obsolete selected-plugin BehaviorSubjects and plugin list signals from `PluginService`.
- Obsolete `PluginProgressbarComponent` usage. Keep the component if other code uses it; otherwise remove in a final cleanup task.
- Obsolete `SearchfilterPipe` usage if the store owns filtering.

## Task 1: Add Typed Models and Mapper Tests

**Files:**

- Create: `ui/src/app/pluginmanager/models/pluginmanager.models.ts`
- Create: `ui/src/app/pluginmanager/utils/pluginmanager.mappers.ts`
- Create: `ui/src/app/pluginmanager/utils/pluginmanager.mappers.spec.ts`

- [ ] **Step 1: Define the initial failing mapper tests**

Add tests that cover:

- installed plugin: `installedVersion === availableVersion` -> `status: 'installed'`
- update: installed exists and differs -> `status: 'updateAvailable'`
- not installed: no installed version -> `status: 'notInstalled'`
- required plugin cannot be deinstalled
- web-bundle plugin gets `isBundle: true`
- overview counts installed/update/notInstalled/bundleUpdates
- local search matches name and plugin ID case-insensitively

Use lightweight plugin objects cast as `pluginFetchClient.Plugin`.

- [ ] **Step 2: Run the mapper spec and verify failure**

Run:

```bash
cd ui
npm test -- --watch=false --include src/app/pluginmanager/utils/pluginmanager.mappers.spec.ts
```

Expected: FAIL because the model/mapper files do not exist yet.

- [ ] **Step 3: Add minimal model types**

Implement `pluginmanager.models.ts` with types similar to:

```typescript
export type PluginManagerStatus = 'installed' | 'updateAvailable' | 'notInstalled' | 'required' | 'actionRunning' | 'actionFailed';
export type PluginManagerActionType = 'install' | 'update' | 'deinstall' | 'bundleInstall';
export type PluginActionPhase = 'idle' | 'starting' | 'download' | 'upload' | 'finish' | 'rollback' | 'done' | 'error';
```

Include `PluginManagerItem`, `PluginManagerOverview`, `PluginManagerAction`, and `PluginManagerError`.

- [ ] **Step 4: Implement pure mapper functions**

Implement functions:

- `toPluginManagerItem(plugin, installedVersions, requiredPluginIds, bundleContent?)`
- `toPluginManagerItems(plugins, installedVersions, requiredPluginIds, bundleContentByPluginId?)`
- `calculatePluginOverview(items, activeAction?, actionError?)`
- `filterPluginItems(items, searchTerm)`

No Angular imports. Do not mutate API plugin objects.

- [ ] **Step 5: Run mapper tests**

Run:

```bash
cd ui
npm test -- --watch=false --include src/app/pluginmanager/utils/pluginmanager.mappers.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add ui/src/app/pluginmanager/models/pluginmanager.models.ts ui/src/app/pluginmanager/utils/pluginmanager.mappers.ts ui/src/app/pluginmanager/utils/pluginmanager.mappers.spec.ts
git commit -m "test: add pluginmanager view model mappers"
```

## Task 2: Split Plugin Data Access From Existing Feature State

**Files:**

- Modify: `ui/src/app/pluginmanager/services/plugin.service.ts`
- Modify: `ui/src/app/pluginmanager/services/plugin.service.spec.ts`
- Modify if needed: `ui/src/app/pluginmanager/services/plugin-meta.service.ts`

- [ ] **Step 1: Write service responsibility tests**

Update `plugin.service.spec.ts` with spies for `FetchApiFactory`, `PluginMetaService`, and `HttpClient` where needed.

Test public methods:

- `loadChannels()` returns sorted channel config and does not update UI state.
- `loadPlugins(product, channel)` calls `pluginV1Api.plugins`.
- `loadBundleContent(product, channel, id)` calls `pluginV1Api.bundleContent`.
- `loadInstalledVersions()` delegates to `pluginmanagerApi.installedPlugins`.
- `resolveDocumentationUrl(product, channel, id)` returns the existing URL format and default URL when `id` is absent.

- [ ] **Step 2: Run service spec and verify failure**

Run:

```bash
cd ui
npm test -- --watch=false --include src/app/pluginmanager/services/plugin.service.spec.ts
```

Expected: FAIL until the new methods exist.

- [ ] **Step 3: Add data-access methods without removing old methods yet**

Add the new public methods to `PluginService`. Keep old methods temporarily so the app still compiles during migration.

Prefer method names:

- `loadChannels(): Observable<ChannelList[]>`
- `loadPlugins(product: string, channel: string): Observable<pluginFetchClient.Plugin[]>`
- `loadBundleContent(product: string, channel: string, pluginId: string): Observable<pluginFetchClient.Plugin[]>`
- `loadInstalledVersions(): Observable<Record<string, string>>`
- `loadPluginReadme(product: string, channel: string, pluginId: string): Observable<string>`
- `resolveDocumentationUrl(product: string, channel: string, pluginId?: string): string`

- [ ] **Step 4: Run service spec**

Run:

```bash
cd ui
npm test -- --watch=false --include src/app/pluginmanager/services/plugin.service.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ui/src/app/pluginmanager/services/plugin.service.ts ui/src/app/pluginmanager/services/plugin.service.spec.ts ui/src/app/pluginmanager/services/plugin-meta.service.ts
git commit -m "refactor: expose pluginmanager data access methods"
```

## Task 3: Add PluginInstallationService

**Files:**

- Create: `ui/src/app/pluginmanager/services/plugin-installation.service.ts`
- Create: `ui/src/app/pluginmanager/services/plugin-installation.service.spec.ts`
- Modify: `ui/src/app/pluginmanager/services/plugin.service.ts`

- [ ] **Step 1: Write installation service tests**

Test at least:

- `installPlugin(plugin, product, channel)` emits progress phases and completes with `done`.
- failed download triggers rollback and emits/throws typed failure.
- failed finish triggers rollback.
- `deinstallPlugin(plugin)` deletes the newest static-web document.
- required plugin deinstall is rejected before delete.

Mock `FetchApiFactory`, `HttpClient`, and required-plugin check. Keep tests focused on orchestration, not browser upload internals.

- [ ] **Step 2: Run the new spec and verify failure**

Run:

```bash
cd ui
npm test -- --watch=false --include src/app/pluginmanager/services/plugin-installation.service.spec.ts
```

Expected: FAIL because service does not exist.

- [ ] **Step 3: Move workflow code into the new service**

Move/adapt from `PluginService`:

- `startInstallation`
- `downloadPlugin`
- `uploadPlugin`
- `finishInstallation`
- `rollbackInstallation`
- `extractPluginUploadHeaders`
- `installProgress`
- deinstall document delete logic

The new service should return typed progress/results based on `PluginManagerAction` or a dedicated workflow event type. It should not hold selected-plugin or plugin-list UI state.

- [ ] **Step 4: Keep compatibility while migrating**

If current components still call old `PluginService.installPlugin`, keep delegating wrapper methods in `PluginService` temporarily:

```typescript
installPlugin(plugin: pluginFetchClient.Plugin): Observable<PluginInstallState> {
  return this.pluginInstallationService.installPlugin(plugin, this.product, this.channel);
}
```

Mark these wrappers for deletion in the final cleanup task.

- [ ] **Step 5: Run installation service tests**

Run:

```bash
cd ui
npm test -- --watch=false --include src/app/pluginmanager/services/plugin-installation.service.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add ui/src/app/pluginmanager/services/plugin-installation.service.ts ui/src/app/pluginmanager/services/plugin-installation.service.spec.ts ui/src/app/pluginmanager/services/plugin.service.ts
git commit -m "refactor: isolate plugin installation workflow"
```

## Task 4: Implement PluginManagerStore

**Files:**

- Modify: `ui/src/app/store/pluginmanager.store.ts`
- Create: `ui/src/app/store/pluginmanager.store.spec.ts`
- Modify as needed: `ui/src/app/pluginmanager/models/pluginmanager.models.ts`

- [ ] **Step 1: Write store tests**

Cover:

- initial state has no selected plugin, empty list, empty search, no active action
- `initialize(routeChannel)` chooses valid route channel
- invalid route channel falls back to first API channel and exposes normalized channel
- `changeChannel(channel)` clears selection and contextual errors
- `setSearchTerm(term)` affects filtered items through computed state
- `selectPlugin(id)` sets selected plugin when it exists
- successful action reloads plugins and preserves selection if still present
- failed action stores contextual error and calls `ToastService.error`
- active action blocks a second action

- [ ] **Step 2: Run store spec and verify failure**

Run:

```bash
cd ui
npm test -- --watch=false --include src/app/store/pluginmanager.store.spec.ts
```

Expected: FAIL because store is not implemented.

- [ ] **Step 3: Implement state and computed signals**

Use `signalStore({ providedIn: 'root' }, withState(...), withComputed(...), withMethods(...))`.

State should include:

- `product: string`
- `channels: ChannelList[]`
- `activeChannel: string | null`
- `items: PluginManagerItem[]`
- `selectedPluginId: string | null`
- `searchTerm: string`
- `isLoadingChannels: boolean`
- `isLoadingPlugins: boolean`
- `loadError: PluginManagerError | null`
- `actionError: PluginManagerError | null`
- `activeAction: PluginManagerAction | null`
- `normalizedChannel: string | null`

Computed signals should include:

- `filteredItems`
- `selectedPlugin`
- `overview`
- `hasChannels`
- `isBusy`
- `canRunAction`

- [ ] **Step 4: Implement rxMethods**

Implement:

- `initialize(routeChannel: string | null)`
- `loadPluginsForActiveChannel()`
- `changeChannel(channel: string)`
- `runPluginAction({ item, actionType })`

Use `PluginService` for data access, `PluginInstallationService` for actions, mapper functions for view models, and `ToastService` for global errors.

- [ ] **Step 5: Run store tests**

Run:

```bash
cd ui
npm test -- --watch=false --include src/app/store/pluginmanager.store.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add ui/src/app/store/pluginmanager.store.ts ui/src/app/store/pluginmanager.store.spec.ts ui/src/app/pluginmanager/models/pluginmanager.models.ts
git commit -m "feat: add pluginmanager signal store"
```

## Task 5: Build Presentational Workbench Components

**Files:**

- Create: `ui/src/app/pluginmanager/plugin-workbench/*`
- Create: `ui/src/app/pluginmanager/plugin-channel-nav/*`
- Create: `ui/src/app/pluginmanager/plugin-search/*`
- Create: `ui/src/app/pluginmanager/plugin-overview/*`
- Create: `ui/src/app/pluginmanager/plugin-detail/*`
- Create: `ui/src/app/pluginmanager/plugin-documentation-panel/*`
- Modify or replace: `ui/src/app/pluginmanager/plugin-list/*`

- [ ] **Step 1: Write component tests for presentational behavior**

Add focused specs for:

- channel nav renders channels and emits selected channel
- search emits term changes
- list renders status/version/bundle badge and emits selected plugin
- overview renders counts
- detail renders correct primary action label for install/update/deinstall
- documentation panel renders iframe for trusted URL

- [ ] **Step 2: Run new component specs and verify failure**

Run:

```bash
cd ui
npm test -- --watch=false --include 'src/app/pluginmanager/**/*.spec.ts'
```

Expected: FAIL until components are implemented.

- [ ] **Step 3: Implement components with signal inputs/outputs**

Use Angular standalone components, `ChangeDetectionStrategy.OnPush`, `input()` and `output()` where practical.

Keep components presentational:

- no API calls
- no route navigation
- no direct store injection except the top-level container/workbench if necessary
- no direct DOM manipulation

- [ ] **Step 4: Use Tailwind/DaisyUI utility classes**

Build the Workbench:

- left column: channel nav, search, compact plugin list
- right column: overview when no selected plugin, detail when selected
- mobile: detail area can be full-width below list or use existing shared dialog only if simple and tested

Avoid nested card-heavy layout. Keep the UI dense and admin-focused.

- [ ] **Step 5: Run component specs**

Run:

```bash
cd ui
npm test -- --watch=false --include 'src/app/pluginmanager/**/*.spec.ts'
```

Expected: PASS for component specs.

- [ ] **Step 6: Commit**

```bash
git add ui/src/app/pluginmanager
git commit -m "feat: add pluginmanager workbench components"
```

## Task 6: Wire Container, Routing, and Store

**Files:**

- Modify: `ui/src/app/pluginmanager/pluginmanager.component.ts`
- Modify: `ui/src/app/pluginmanager/pluginmanager.component.html`
- Modify: `ui/src/app/pluginmanager/pluginmanager.component.scss`
- Modify: `ui/src/app/pluginmanager/pluginmanager.routes.ts`
- Modify: `ui/src/app/pluginmanager/pluginmanager.component.spec.ts`

- [ ] **Step 1: Write container tests**

Test:

- component initializes store with route channel
- valid channel selection navigates to `:channelName`
- invalid/missing channel normalization navigates to fallback when store exposes it
- workbench receives store signals and emits commands to store methods

- [ ] **Step 2: Run container spec and verify failure**

Run:

```bash
cd ui
npm test -- --watch=false --include src/app/pluginmanager/pluginmanager.component.spec.ts
```

Expected: FAIL until component wiring is updated.

- [ ] **Step 3: Reduce `PluginmanagerComponent` to a container**

Remove local ownership of:

- `pluginInstallList`
- selected plugin observable
- plugin info URL signal
- channel observable
- installation subscriptions
- direct install/deinstall workflow calls

Inject:

- `PluginManagerStore`
- `ActivatedRoute`
- `Router`
- `DomSanitizer` only if documentation URL conversion remains in container; prefer documentation panel/store boundary instead.

- [ ] **Step 4: Update routing**

Keep route support for `:channelName`.

If the child route exists only to render `PluginListComponent`, remove the child component dependency and let `PluginmanagerComponent` own the workbench. The container should read `channelName` from `ActivatedRoute.firstChild` or route params, depending on final route shape.

- [ ] **Step 5: Run container spec**

Run:

```bash
cd ui
npm test -- --watch=false --include src/app/pluginmanager/pluginmanager.component.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add ui/src/app/pluginmanager/pluginmanager.component.ts ui/src/app/pluginmanager/pluginmanager.component.html ui/src/app/pluginmanager/pluginmanager.component.scss ui/src/app/pluginmanager/pluginmanager.routes.ts ui/src/app/pluginmanager/pluginmanager.component.spec.ts
git commit -m "refactor: wire pluginmanager workbench container"
```

## Task 7: Remove Obsolete PluginService State and Legacy UI Paths

**Files:**

- Modify: `ui/src/app/pluginmanager/services/plugin.service.ts`
- Modify: `ui/src/app/pluginmanager/services/plugin.service.spec.ts`
- Modify/remove if unused: `ui/src/app/pluginmanager/progressbar/*`
- Modify/remove if unused: `ui/src/app/pluginmanager/pipe/searchfilter.pipe.ts`
- Modify/remove if unused: `ui/src/app/pluginmanager/plugin-list/*`

- [ ] **Step 1: Search for legacy usages**

Run:

```bash
rg -n "selectedPlugin|pluginsSignal|filteredText|isLoadingPlugins|changeChannel\\(|reloadPlugin\\(|installBundle\\(|deintallPlugin\\(|installPlugin\\(|plugin-progressbar|searchfilter" ui/src/app
```

Expected: only intentional new compatibility or no usage.

- [ ] **Step 2: Remove obsolete state from `PluginService`**

Delete:

- selected-plugin BehaviorSubject
- iframe BehaviorSubject if unused
- plugin list signals
- `currentInstallations$` UI stream if replaced by store action state
- compatibility install/deinstall wrappers once no callers remain

Keep only data-access methods from Task 2.

- [ ] **Step 3: Remove or simplify legacy components/pipes**

If `PluginProgressbarComponent` and `SearchfilterPipe` are no longer referenced, delete their files and specs. If `PluginListComponent` is reused as the compact list, keep it and ensure it is presentational.

- [ ] **Step 4: Run search again**

Run:

```bash
rg -n "selectedPlugin|pluginsSignal|filteredText|isLoadingPlugins|currentInstallations|plugin-progressbar|searchfilter" ui/src/app
```

Expected: no obsolete references.

- [ ] **Step 5: Run pluginmanager specs**

Run:

```bash
cd ui
npm test -- --watch=false --include 'src/app/pluginmanager/**/*.spec.ts' --include src/app/store/pluginmanager.store.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add ui/src/app/pluginmanager ui/src/app/store/pluginmanager.store.ts
git commit -m "refactor: remove legacy pluginmanager state paths"
```

## Task 8: Full Verification and Visual Smoke Test

**Files:**

- Modify only if fixes are needed.

- [ ] **Step 1: Run targeted tests**

Run:

```bash
cd ui
npm test -- --watch=false --include 'src/app/pluginmanager/**/*.spec.ts' --include src/app/store/pluginmanager.store.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run full UI test suite if runtime allows**

Run:

```bash
cd ui
npm test -- --watch=false
```

Expected: PASS. If unrelated failures exist, document them with file/test names and keep targeted pluginmanager tests passing.

- [ ] **Step 3: Run build**

Run:

```bash
cd ui
npm run build
```

Expected: successful Angular build.

- [ ] **Step 4: Start local app for manual smoke**

Run:

```bash
cd ui
npm start
```

Open the served URL and verify:

- pluginmanager route loads
- direct channel route works
- channel change clears selection
- local search filters list
- selecting a plugin shows detail panel
- no selection shows overview
- bundle plugin shows bundle badge and content summary
- documentation panel renders
- action buttons disable while an action is active

- [ ] **Step 5: Commit any verification fixes**

```bash
git add ui/src/app/pluginmanager ui/src/app/store/pluginmanager.store.ts ui/src/app/store/pluginmanager.store.spec.ts
git commit -m "fix: polish pluginmanager workbench verification"
```

Only commit if fixes were needed.

## Final Handoff Checklist

- [ ] `git status --short --branch` shows a clean worktree.
- [ ] Targeted pluginmanager tests pass.
- [ ] Build passes or any blocker is documented.
- [ ] Final response includes changed files, verification commands, and any residual risks.

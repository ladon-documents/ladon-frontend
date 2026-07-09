# Pluginmanager Refactor Design

Date: 2026-07-09
Branch: `codex/pluginmanager-refactor-definition`
Scope: `ui/src/app/pluginmanager` and related pluginmanager state/services

## Goal

Refactor the Draco Pluginmanager into a new store-driven workbench. The refactor should keep the existing plugin-management capabilities, but replace the current mixed component/service structure with clear Angular state, data-access, domain, and presentation boundaries.

The new implementation should support:

- channel-based plugin browsing
- local plugin search
- installed/current/latest version visibility
- install, update, and deinstall actions
- web-bundle plugins as first-class list entries
- explicit loading, empty, error, and active-action states
- a redesigned workbench UI

## Current Problems

The current Pluginmanager mixes responsibilities across the Angular component and `PluginService`:

- `PluginmanagerComponent` owns routing, iframe URL state, installation state, breakpoint handling, and action dispatch.
- `PluginService` owns API calls, feature state, selected plugin state, web-bundle orchestration, version enrichment, transaction handling, download/upload, rollback, and UI-facing signals.
- `PluginmanagerStore` exists but is currently not used as the feature state boundary.
- Tests mostly check object creation and do not protect status mapping, channel behavior, bundle behavior, or install/deinstall workflows.

## Architecture

Use a store-centered architecture.

`PluginManagerStore` becomes the source of truth for the feature's UI and workflow state. It should be implemented with the existing project pattern around NgRx Signal Store, `patchState`, computed signals, and `rxMethod` for asynchronous operations.

The store owns:

- channels
- active channel
- plugin items for the active channel
- selected plugin ID
- local search term
- loading and error state
- active plugin action
- derived counts and filtered list

`PluginService` becomes a data-access service. It should expose API-focused methods and avoid holding feature UI state.

Expected responsibilities:

- load plugin channels
- load plugins for a product/channel
- load bundle content for a web-bundle plugin
- load installed plugin versions
- load or resolve plugin documentation/readme data

`PluginInstallationService` owns installation orchestration.

Expected responsibilities:

- start transaction
- download plugin content
- upload plugin content
- finish transaction
- rollback transaction
- deinstall plugin
- expose action progress as typed workflow results

Pure mapper functions should convert API models into stable UI view models. These functions should calculate install/update/deinstall status, bundle metadata, version labels, and overview counts without side effects.

## UI Model

Introduce a UI-facing model such as `PluginManagerItem`. It should be separate from the generated API plugin model.

It should include enough data for the workbench to render without reinterpreting API objects in templates:

- plugin identity
- display name
- plugin type
- whether it is a web bundle
- installed version
- available version
- status
- action capability flags
- documentation URL or documentation source
- bundle content summary when applicable
- raw API plugin reference only if needed by data-access boundaries

Possible status values:

- `installed`
- `updateAvailable`
- `notInstalled`
- `required`
- `actionRunning`
- `actionFailed`

The exact names can be refined during implementation, but the model should be explicit and typed.

## Data Flow

On pluginmanager initialization:

1. Load channels from the API.
2. Validate the route channel against the loaded channel list.
3. If the route channel is valid, use it.
4. If no route channel exists or it is invalid, select the first API channel and normalize the URL.
5. Load plugins for the active channel.

On channel change:

1. Set the active channel.
2. Clear the selected plugin.
3. Clear contextual errors.
4. Navigate to the channel route.
5. Load plugins for that channel.
6. Show the overview panel on the right.

On plugin load:

1. Load available plugins for the active channel.
2. Load installed plugin versions.
3. Detect web-bundle plugins.
4. Load web-bundle content when needed.
5. Map all results to `PluginManagerItem` view models.
6. Update derived counts and filtered results through computed store state.

On install, update, or deinstall:

1. Reject the command if another action is already active.
2. Set `activeAction`.
3. Delegate the workflow to `PluginInstallationService`.
4. Update progress and phase as events arrive.
5. On success, reload the active channel from the backend.
6. Preserve selection if the same plugin still exists in the reloaded channel.
7. Otherwise clear selection and show the overview panel.
8. On failure, store contextual error state and trigger a global toast.

## Routing

The channel route remains part of the feature state.

The route should support direct reload/bookmark behavior, for example `/pluginmanager/stable`. The initial active channel is resolved from the route when valid. Missing or invalid route channels fall back to the first channel returned by the API and should be normalized through navigation.

The route is used for the active channel only. Selected plugin state does not need to be encoded in the URL for this refactor.

## Workbench UI

The Pluginmanager UI should be rebuilt as a two-column workbench.

Left side:

- channel tabs or segmented channel control
- local search input
- compact plugin list

Each plugin list row should show:

- plugin name
- plugin type or bundle badge
- installed version
- available version
- status
- active-action indicator when applicable

The list should remain compact and optimized for scanning. Long descriptions belong in the detail area, not in list rows.

Right side:

- overview panel when no plugin is selected
- detail panel when a plugin is selected
- action/progress/error area
- documentation panel

The overview panel should show counts for:

- installed plugins
- updates available
- not installed plugins
- bundle updates
- active or failed actions

The detail panel should show:

- plugin name and metadata
- installed/current/latest version information
- install/update/deinstall action
- action progress
- contextual errors
- bundle contents for web-bundle plugins
- documentation

On small viewports, the detail panel should open as a dialog or drawer. This should be driven by store/component state rather than unmanaged subscriptions.

## Web-Bundle Behavior

Web-bundle plugins remain normal list entries with a visible bundle badge.

The detail panel for a web bundle should show contained plugins and whether each contained plugin would be installed or updated. The bundle action is treated as the main action, while the detail panel displays progress or status for affected contained plugins.

Bundle installation should preserve the existing transactional intent: start a transaction, process contained plugin updates, finish on success, and rollback on failure.

## Action Concurrency

Only one plugin action may run at a time.

While `activeAction` is set:

- all other install/update/deinstall actions are disabled
- the active plugin row and detail panel show progress
- duplicate commands for the same action are ignored or rejected

This simplifies transaction handling and makes rollback behavior easier to reason about.

## Error Handling

Errors are visible in two places:

- inline in the relevant detail or overview panel
- as a global toast

Channel and plugin load failures should produce a retryable state.

Action failures should remain attached to the affected plugin/action until:

- the user retries
- the channel changes
- the plugin list is successfully reloaded and clears the failure state

Rollback failures should be represented explicitly and should not be hidden behind a generic install failure.

## Documentation Panel

Documentation should be encapsulated behind a `PluginDocumentationPanel`.

The first implementation may continue to render existing README/documentation content through an iframe. The rest of the workbench should not directly depend on iframe details. This keeps the door open for a later native Markdown or sanitized HTML implementation.

Hard-coded documentation URL construction should be isolated in one data-access or documentation helper boundary rather than spread across components.

## Search

Search is local to the loaded active-channel plugin list.

The store holds the search term and exposes a computed filtered list. Remote/API search is out of scope for this refactor.

## Testing

The refactor should add targeted tests for behavior that is currently unprotected.

Required test areas:

- plugin status and capability mapping
- required plugin deinstall rules
- channel resolution from route plus API channel list
- selection clearing on channel change
- selection preservation after successful reload
- local search filtering
- web-bundle item mapping
- overview count calculation
- install/update success flow
- install/update failure flow
- deinstall success and failure flow
- global toast triggering for action errors

Component tests should focus on UI bindings and command emission. Store and mapper tests should carry most of the behavioral coverage.

## Out Of Scope

This design does not include:

- remote plugin search
- URL state for selected plugin
- replacing iframe documentation with native Markdown/HTML rendering
- changing backend API contracts
- supporting multiple concurrent plugin actions
- redesigning unrelated Draco application areas

## Implementation Notes

Implementation should happen incrementally:

1. Add typed UI models and pure mapper tests.
2. Reduce `PluginService` toward data access.
3. Introduce `PluginInstallationService`.
4. Implement `PluginManagerStore`.
5. Rebuild the workbench components against the store.
6. Preserve behavior through tests before removing obsolete code paths.

The implementation plan should be written separately after this design is reviewed and approved.

---
description: 'Regenerate API clients from OpenAPI specs, then verify the UI compiles and fix all resulting TypeScript errors and warnings.'
tools: ['execute/runInTerminal', 'execute/getTerminalOutput', 'filesystem/readFiles', 'filesystem/writeFiles', 'codebase/getErrors']
argument-hint: 'Which spec(s) to regenerate? (api.yaml | plugin-v1.yaml | plugin-v2.yaml | all)'
---

## Goal

Regenerate one or more API clients from OpenAPI specs, then ensure the Angular UI builds cleanly — fixing all TypeScript errors and warnings introduced by the regeneration.

---

## Step 1 — Identify target spec(s)

Parse the user's request to determine which spec(s) to regenerate:

| User input | Specs targeted |
|---|---|
| `api` / `api.yaml` | `spec/api.yaml` → fetch-client + angular-client |
| `plugin` / `plugin-v1` | `spec/plugin-v1.yaml` → angular-plugin-client |
| `all` or unspecified | All three generators |

If the request is ambiguous, ask before proceeding.

---

## Step 2 — Regenerate API clients

Run from the **workspace root**:

```bash
npm run build:api
```

This runs `npm --prefix ./api run build:all` which:
1. Runs all three OpenAPI generators in parallel (`generate:apis`)
2. Bundles the utility layer (`build:utility`)

> Wait for the command to finish and check for generator errors before continuing.
> If the generator fails, report the error and stop — do not proceed to UI compilation.

---

## Step 3 — Check UI compilation

Run from the **workspace root**:

```bash
npm run serve:ui
```

This runs `ng serve` inside `ui/`. Capture the full output.

Also call `get_errors` on `ui/src/` to gather TypeScript diagnostics from the IDE.

---

## Step 4 — Triage errors and warnings

Classify each issue:

| Category | Action |
|---|---|
| Import not found (`@ladon/api`, `@ladon/utility`) | Model/service was renamed or removed — find the new name in `api/index.ts` and update the import |
| Property does not exist on type | Model shape changed — update usages in `ui/src/` |
| Type mismatch | Adapt the consuming code to match the new type |
| Unused import / variable | Remove it |
| Generated file error | **Do NOT edit** files under `api/angular-client/`, `api/angular-plugin-client/`, or `api/fetch-client/` — fix the OpenAPI spec or generator config instead |
| Specs files in  `spec/` | **Do not edit** yaml files |

---

## Step 5 — Apply fixes

Fix only files under `ui/src/`. Follow all architecture patterns, constraints, and gotchas defined in [`copilot-instructions.md`](../copilot-instructions.md) — in particular the sections on **TypeScript Path Aliases**, **Critical Architecture Patterns**, and **Important Constraints & Gotchas**.

> Do not regenerate API files to mask an error.

---

## Step 6 — Verify

Re-run:

```bash
npm run serve:ui
```

Confirm zero errors and zero warnings. If issues remain, repeat Steps 4–6 until the build is clean.

---

## Completion criteria

- [ ] `npm run build:api` succeeded with no generator errors
- [ ] `npm run serve:ui` succeeds with **zero errors and zero warnings**
- [ ] No generated files (`api/angular-client/`, `api/fetch-client/`, `api/angular-plugin-client/`) were manually edited
- [ ] All imports in changed files use the correct path aliases

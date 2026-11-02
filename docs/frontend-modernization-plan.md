# Frontend-Modernisierungsplan — Ladon Draco UI

> Branch: **`agenticUpdate`** (Arbeit ausschließlich hier).
> Stand: Erstellt im Rahmen der autonomen Modernisierung. Aktualisiert pro Arbeitspaket.
> Prinzip: **Sicherheit & API-Kompatibilität > Erhalt der Fach-Funktion > Korrektheit/Tests > UI/UX & Barrierefreiheit > Architektur/Performance > Feinschliff.**

---

## 1. Phase A — Bestandsaufnahme (ohne Änderungen)

### 1.1 Repository & Git
- Repo: `github.com/ladon-documents/ladon-frontend`, aktueller Branch `agenticUpdate` (HEAD `d4afb7d`, „two-factor-authentication"), Working-Tree **sauber**.
- Konventionen: **Conventional Commits** (siehe `.github/prompts/conventional-commit.prompt.md`), 9 Typen, optional Scope.
- CI: `Jenkinsfile` rein **tag-gated** (`git describe --tags` → `npm run release` → `npm publish` + Slack). **Keine Automatik auf Branches ohne `vX.Y.Z`-Tag.** → Keine Deploy-Gefahr beim Arbeiten auf `agenticUpdate`.
- **Keine Commits, kein Push** (nicht beauftragt).

### 1.2 Werkzeuge / Versionen
- Node **v22.15.0**, npm **10.9.2**.
- Angular **^19.2.8** (Core/CDK/Elements/Cli …), TypeScript **5.7.3**, RxJS ^7.8.2, zone.js ~0.15.
- `@ngrx/signals` 19.1, `@ngx-translate` 16, `@ng-icons/*`, `monaco-editor`, `ngx-extended-pdf-viewer`, `marked`, `lodash`, `tailwindcss`(v4)/`daisyui`, `webpack`+`esbuild`.
- **Formatierer:** Prettier (120-Ch.-Breite, `npm run prettier:format` in `ui`). **Linter:** `tslint` steckt in `devDependencies`, ist aber **nicht im Build verdrahtet** (siehe §1.6) — effektiver Linter = TypeScript-Compiler. (Doku-Drift: `tslint` ist obsolet → ESLint; hier jedoch nur dokumentieren, nicht umstellen.)
- **npm-Workspaces** (root): `api, globals, style, ui, wc/*`. Alle produktiven Dependencies sind **öffentlich** auf `registry.npmjs.org`; privater Nexus (`@mind/`) wird **nur zum Publishen** gebraucht → `npm install` ohne Auth möglich (bestätigt, 1149 Pk., exit 0).

### 1.3 Architektur (UI)
- **Standalone-Components + Signals** durchgängig, keine klassischen NgModules außer `forRoot`/`loadChildren`.
- **App-Einstieg:** `ui/src/main.ts` → lädt `navigation.json` (Backend), `Initalizer().initWebComponents(env.webComponents)`, anschließend `bootstrap.ts` → `bootstrapApplication(AppComponent, appConfig)`.
- **State:** `signalStore` in `ui/src/app/store/*` (12 Stores + `features/request-status.feature.ts`). Services in `services/` (36) und `shared/services/` (Toast/ContextMenu/ConfirmationDialog/InputDialog/KeyboardShortcuts/Sidebar) mit **Signal-basiert** State.
- **Routing:** datengetrieben aus Backend-`navigation.json` via `setNavigationDefinitions()`; fixe Routen `login`, `rapid/:rapidId`, `pdf`, `account-settings`; **dynamic import per String-Konkatenation** über `navItem.component` (siehe §1.7, Risiko P1).
- **HTTP:** ein Interceptor `interceptors/token.interceptor.ts` (Token-Injection, global). Basispfade `/admin` (+`/plugins`, `ngx-translate` Loader `./public/i18n/`).
- **Web-Components** (`wc/*`, 6 Stück, je mini-Angular-App + `@angular/elements` → `wc-<name>.js`): `clipboard`, `pdfviewer`, `mediaplayer`, `audioplayer`, `imageeditor`, `editor`(eigene `MonacoEditor`-UMD-Variante). Eingebettet via `CUSTOM_ELEMENTS_SCHEMA`.
- **Shared-Components:** pill, document-tags, calendar, context-menu, confirmation-dialog, folder, pdfviewer, dialog, markdown-viewer, uploads, spinner, input-dialog, move-or-copy-dialog, search-modal, toast, upload-progress, clipboard.
- **Feature-Fachgebiete:** buckets, layout(aside), editor, taskmanager, avatar, login, searchbar, navigation, account-settings, filemanager (größtes Feature, ~15 Subkomponenten incl. meta/sidebar/workspace-view/pagination/breadcrumb/image-editor-dialog/file-editor-dialog/create-new-file/tags/preview/file-uploader/content/create-folder), usermanager, rapidweb, themes, pdf-viewer, header, pluginmanager.
- **Größe:** 61 Komponenten, 36 Services, 12 Stores, 59 HTML-Templates, **~44 `: any`**, **~37 `as any`**.

### 1.4 API-Integration (zu schützen)
- Generierte Clients aus OpenAPI (`api/`): `fetch-client` + `plugin-fetch-client` (esbuild → `dist/ladon-api/*.mjs`). **Generated-Dateien nicht editieren** (regenerieren via `build:api`).
- UI bindet **build-time** per tsconfig-Aliases `@ladon/api`/`@ladon/utility` direkt an.
> **Hinweis Doku-Drift:** `.github/copilot-instructions.md` spricht von `angular-client/` und „Angular Client (HttpClient)", ist aber faktisch `fetch-client`+`plugin-fetch-client` (Generator `typescript-fetch`, isomorph), NICHT `angular-client`. → §WP-P2.1 korrigiert.

### 1.5 Bestehende Tests & Qualität
- **109 `*.spec.ts`** (Jasmine/Karma; `ui` `ng test`). Verteilung über alle Features/Stores/Guards/Interceptors.
- **Karma-Config:** kein `karma.conf.*` gefunden; Browser = Chromium (`/usr/bin/chromium-browser`), nicht-root → Headless-Sandbox sollte lauffähig sein. **Lauffähigkeit ist Baseline-Prüfung (WP-P0.0).**
- **Baseline-Validierung:** Produktions-`ng build` + Subset-Tests werden vor den ersten Änderungen ausgeführt und im Plan protokolliert (Alt-Fehler vs. neu).

### 1.6 Stärken
- Moderne Basis (Standalone+Signals, lazy Routes, i18n-ready, zentrales Design-System via CSS-Variablen/DaisyUI, ConfirmationDialog/InputDialog/Toast existieren bereits, Guards vorhanden, 109 Tests).

### 1.7 Schwächen / Risiken (faktbasiert)
| ID | Befund | Quelle | Priorität |
|---|---|---|---|
| R1 | `setNavigationDefinitions` importiert per **String-Verknüpfung** `import('./' + comp + '/')`; falscher Backend-Eintrag → fehlgeschlagene Route (wird `catch`-t, fällt in `EmptyRouteComponent`), dazu `console.log(_appRoutes)` – ganze Route-Tabelle im Production-Console | `app.routes.ts:78,86` | P2 |
| R2 | **Barrierefreiheit:** viele klickbare `<div>/<span>/<li>/<th>` mit `(click)`+`cursor-pointer` **ohne** Tastatur/Rollen/Fokus (taskmanager, breadcrumb, filemanager-Sort-Header, pill) | viele `.html` | P1 |
| R3 | **Debug-Noise:** 33× `console.log` (+17 warn +19 error), u. a. `console.log(_appRoutes)` (ganze Route-Tabelle) im Produktionsbuild | `app.routes.ts` etc. | P2 |
| R4 | **Typsicherheit:** ~44 `: any`, ~37 `as any` (u. a. `NavigationData.canActivate: any[]`) | repo-weit | P2 |
| R5 | **Stubs/TODO** (12): keyboard-shortcuts (select-all/copy/cut/paste/delete/rename/preview/deselect), converter.service (error/success-Events ungelöst), buckets „rename" nicht implementiert | `keyboard-shortcuts.service.ts`, `converter.service.ts`, `buckets.component.ts` | P1–P2 |
| R6 | **markdown-viewer** rendert `marked.parse()` über `[innerHTML]` (Angular-Standard-Sanitizer schützt Skripte; **zu verifizieren**, falls sanitizing umgangen wird) | `markdown-viewer.component.ts:30` | P1 (verifizieren) |
| R7 | **Zwei Editor-Implentationen** (`wc/editor` UMD vs. `ui/.../editor` CDN-Monaco), `audioplayer` vs. `mediaplayer` überlappend (Audio-Wellenform) — Zuständigkeits-/Duplikations-Drift | repo-wide | P2 (dokumentieren) |
| R8 | **Ladung/Leer-/Fehler-/Disabled-Zustände** nicht einheitlich über die Features (nicht zentralisiert) | — | P1/P2 |
| R9 | **Doku-Drift** (copilot-instructions vs. Realität, tslint obsolet) | `copilot-instructions.md` | P2 |

---

## 2. Phase B — Plan

### 2.1 Ziele & Abnahmekriterien
- **API-Kompatibilität (hart):** Keine Änderung von Endpunkten, HTTP-Methoden, Request/Response-Schemata, Query-Params, Paginierung/Sortierung/Filterung, Upload/Download-Zeitformen, Fehlerkonventionen, Auth/Token-Handling. → Verifiziert durch: unangetastete `api/*` (regeneriert, nicht hand-editiert), bestehende `*.interceptor`/`*.service`-Konsistenz, erfolgreiche `ng build`, keine neuen Typfehler in api-nahen Diensten, `git diff` zeigt **0** Änderungen unter `api/fetch-client/`, `api/plugin-fetch-client/`.
- **Erhalt der Feature:** Alle 61 Komponenten/12 Stores bleiben erreichbar; Routing & Deep Links (`baseHref`, same-url reload) unverändert bewahrt. → Verifiziert: `app.routes.spec.ts`, `login-redirect.integration.spec.ts` grün; alle Routen weiterhin erreichbar.
- **Barrierefreiheit (WCAG 2.2 AA Ziel):** Alle interaktiven Elemente (klickbare div/span/th) erhalten Tastaturbedienung (Enter/Space), Fokusvisible und semantische Rolle; Kontrast & Fokus-Ringe konsistent. → Verifizert: manuell + neue a11y-Tests für betroffene Komponenten; „cursor-pointer"-Elemente ohne Tastaturpfad reduziert.
- **Fehler/Leer-/Ladezustände:** Einheitliche Zustände für leere Listen, Fehlern, Loading und Disabled in den zentralen Listen-/Detailansichten.
- **Codequalität:** Reduktion von `: any`/`as any` im Kern (Routing/Config + kritische Stores), Prettier grün, `ng build` grün, betroffene Unit-Tests grün + neue Tests.
- **Build:** `npm run build:all` (api→globals→styles→ui) und `ng build` (ui) erfolgreich; kein regressiver Kompilierfehler.

### 2.2 Priorisierung
- **P0:** Baseline-Sicherung (Build+Test lauffähig machen, Alt-Fehler dokumentieren); **API-nahe Risiken nicht spekulativ ändern**, wenn Vertrag unklar (R6 verifizieren, bei Unsicht *behalten* + dokumentieren).
- **P1:** R1 (Routing-Robustheit + Produkions-Console-Noise absenken), R2 (A11y klickbare Elemente), R5 teilweise (kritische Stubs → kluge Fehlerbehandlung/keine leeren Features), R6 (XSS-verifikation/markdown), R8 (Lade-/Leer-/Fehlerzustände in zentralen Ansichten).
- **P2:** R4 (`any`-Reduktion im Kern), R3 (Console-Noise zentral), R9 (Doku/Kopilot), R7 (Duplikation dokumentieren), a11y-Fokus-Ring global.
- **P3:** Virtual-Scrolling / Bundle-Optimierung / Framework-Upgrade (als Roadmap dokumentiert, **nicht** im ersten Durchgang — zu risikoreich).

Für jedes Arbeitspaket: Zweck/Nutzen · betroffene Dateien · Abhängigkeiten · Schritte · zu erhaltende Verträge · Tests · Prüfbefehle · Abnahmekriterien · Risiko/Rückfall.

### 2.3 Arbeitspakete (Reihenfolge)
1. **WP-P0.0 Baseline-Validierung** — `ng build` (ui) + Subset-Tests grüner Ausgangszustand; Alt-Fehler protokollieren. *Rückfall: nichts.*
2. **WP-P1.1 Routing- & Log-Robustheit** — `app.routes.ts`: `NavigationData` typisieren, `console.log(_appRoutes)` + andere produktionsrelevante Logs hinter `environment`-Flag/`debug` gate; Dynamic-Import-Fallback bleibt (catcht), aber klarer. *Vertrag: Routen-Verhalten unverändert, `onSameUrlNavigation: 'reload'` erhalten.*
3. **WP-P1.2 Barrierefreiheit — klickbare Elemente** — Tastatur (Enter/Space via `(keydown)`+Role/Button-Umbau wo sinnvoll), `type="button"`, Fokus-Ringe; zuerst kleine, klar abgegrenzte Komponenten (pill, breadcrumb, taskmanager-Liste, filemanager Sort-Header). *Vertrag: Verhalten (Sort/Toggle/Select) identisch.*
4. **WP-P1.3 Lade-/Leer-/Fehler-/Disabled-Zustände** — in zentralen Listen-/Detailansichten (z. B. filemanager-content, taskmanager) konsistente Le-/Fehler-Rendering, mit bestehender Toast-/Spinner-Reuse.
5. **WP-P1.4 XSS-verifikation markdown-viewer** — klären, ob Angular-Standard-Sanitizer greift; falls nicht, gezieltes/erweitertes Sanitize einbinden (ohne Rendering-Verlust); Test ergänzen. *Nur ändern, wenn Nachweis einer Lücke.*
6. **WP-P2.1 Console-Noise** — repo-weite, umgebungs-abhängige Debug-Helfer (z. B. `logger`) einführen; `console.log/warn` hinter Flag, echte Fehler (error) behalten. *Nur in UI; kein API-Effekt.*
7. **WP-P2.2 `any`-Reduktion im Kern** — `app.routes.ts`, `app.config.ts`, kritische Stores auf saubere Typen (ohne API-Contract-Falschinterpretation). 
8. **WP-P2.3 Doku** — `copilot-instructions.md` + neue `AGENTS.md` auf echten Zustand aktualisieren (`angular-client`→`fetch-client`+`plugin-fetch-client`, Linter-Realität, A11y-Grundlagen). *Kein Code.*
9. **WP-P2.4 Duplikations-Inventar** — `wc/editor` vs. `ui/editor`, `audioplayer` vs. `mediaplayer`: Zuständigkeiten dokumentieren; **nicht** vereinen (Funktions-Erhalt!).
10. **WP-P3 (Roadmap, nicht im ersten Durchgang)** — Virtual-Scrolling, Bundle-Trimming, möglicher Framework-Upgrade-Vorschlag.

### 2.4 UI/UX-Konzept (auf bestehendes Design-System)
- **Grundlage:** bestehendes Tailwind-v4 + DaisyUI-System mit HSL-CSS-Variablen (`--primary-hue` als Single-Source-of-Truth). **Kein neues großes UI-Framework** hinzufügen.
- **Konsistenz:** Einheitliche Abstände/Typo/Farben über `--color-*`/`data-theme`; einheitliche States (loading=Spinner-Komponente, empty, error=Toast/Fehlerkarte, disabled-Handling) für Buttons/Inputs/Tabellen/Dialoge.
- **Interaktion:** destruktive Aktionen über bestehende `ConfirmationDialogService` (schon genutzt); Mehrfach-Aktionen bei async-Verben verhindern (disabled während in-flight).
- **A11y:** Fokus-visible global (`:focus-visible` auf dem Root/`--color-primary`), Tastaturpfade, `role`/`aria-*`-Semantik für klickbare nicht-native Elemente, Kontrast ≥ 4.5:1 im Text (Prüfung bei Designänderung).
- **Responsive:** Breakpoints über DaisyUI/Tailwind; bestehende Layouts erhalten, nur nachweislich kaputte/leere Zustände beheben.
- **Kein generischer Dashboard-Look** — an den Aufgaben (Dokumenten-Arbeitsplatz, FileManager, Task-/Plugin-Manager, Rapidweb) orientieren.

---

## 3. Fortschrotprotokoll (Pro WP aktualisiert)

### WP-P0.0 Baseline-Validierung — ABGESCHLOSSEN (Faktenergebnis)
- `npm install` → **OK** (1149 Pk., exit 0). Alle Produkt-Dependencies öffentlich; privater Nexus nicht nötig (nur `publishConfig`/Publish).
- `npm run build:api` → **OK** (generiert `fetch-client`+`plugin-fetch-client`, OpenAPI 5.3.21).
- `npm run build:styles` → **OK** (postcss/Tailwind/DaisyUI → `style/dist/styles/global.css`).
- `ng build` (ui/ Produktion) → **GRÜN** (exit 0, Output `ui/dist/ladon-core`). Die „Empty sub-selector"-Zeilen sind harmlose DaisyUI/Tailwind-Warnungen, **keine** Fehler.
- `npm run build:all` → **rot** nur an `@ladon/globals`: `globals/build.js` erwartet `globals/node_modules`, aber mit Workspaces-hoisting liegen Deps im root-`node_modules` (ENOENT). → siehe WP-P1.0 (kein API/Compile-Problem, reine Paketierungs-Brechlichkeit).
- **API-Kompatibilität:** UI-Code passt **exakt** zum generierten Client. `RoleEntry{name}`, `Permission{permissionId}`, `UserEntry{name,email?,avatar?,status}` existieren → die in der **ersten** `ng build` (ohne generierte Clients) ontschienenen `MappedRole.name`/`MappedPermission.permissionId`/„no exported member"-Fehler waren **reine Generierungsartefakte**, **kein** echter Vertrag-Mismatch. **→ Kein API-Vertrag muss „repariert" werden.**

### Erkannte, belastbare Hebel (faktbasiert, nicht spekulativ)
- **H-Build:** `globals/build.js` hoisting-inkompatibel.
- **H-Logging:** 33× `console.log` im Produktions-Code (u. a. `app.routes.ts:86` Route-Tabelle, Buckets/FileManager-Keys/Document-Namen) → mögliche interne Zustands-/Daten-Ausgabe im Browser; plus `LoggerService` ist **toter Code** (setzt `LogLevel.OFF`, ignoriert `environment.logger`). → **durch WP-P1.1 angegangen** (dev-gated via `devLog`-Helper; echte `warn`/`error` behalten; `LoggerService` an `environment.logger` gekoppelt).
- **H-a11y:** **kein** `:focus-visible` (repo-weit 0 Treffer); zahlreiche klickbare `<div>/<span>/<th>/<li>` mit `(click)`+`cursor-pointer` **ohne** Tastaturweg (role/tabindex/keydown).
- **H-Doku:** `copilot-instructions.md` beschreibt `angular-client/` + „Angular Client (HttpClient)"; real existiert `fetch-client/`+`plugin-fetch-client/` (isomorph, `typescript-fetch`). Linter: nur `tslint` (obsolet) in devDeps, im Build **nicht** verdrahtet; effektiv nur TS-Compiler.
- **H-Types:** `NavigationData.canActivate: any[]` etc. in `app.routes.ts`; 44× `: any`, 37× `as any` repo-weit.
- **H-Stub-Features (funktionstotal/unsicher):** `keyboard-shortcuts.service.ts` (Select-all/Copy/Cut/Paste/Delete/Rename/Quick-Preview/Deselect = reine `console.log`+`TODO`); `buckets` „Rename" nicht implementiert; `converter.service` Erfolg/fehler-Events ungesteuert.

### Umsetzung-Reihenfolge (angepasst)
- [x] **WP-Doku** (0 Risiko): `copilot-instructions.md` korrigiert (fetch-client/plugin-fetch-client statt fiktives `angular-client`, `@Injectable`-Irrtum behoben, API-Vertrag-Schutz ergänzt) + `AGENTS.md` angelegt (verbindliche Agent-Guardrails, Fakten, Befehle, Defizite). → **erledigt** (nur Doku).
- [x] **WP-P1.0** `globals/build.js` hoisting-tolerant (upward node_modules-Walk, behavior-erhalten). **`build:all` jetzt grün (exit 0)**, `globals/dist/importmap.json` korrekt. → **erledigt**.
- [x] **WP-P1.2a** Globale `:focus-visible` + Wiederverwendungs-Pattern für klickbare Elemente (Tastatur + Focus-Feedback). → **erledigt** (siehe WP-P1.2a-Eintrag unten).
- [x] **WP-P1.1** Debug-`console.log` dev-gated / entfernen (echte Fehler/Warnungen behalten); `LoggerService` an Umfeld koppeln. → **erledigt** (siehe WP-P1.1-Eintrag unten).
- [~] **WP-P1.2b/P2** `any`-Reduktion im Kern (`app.routes.ts`, Config), a11y auf zentrale Interaktionspunkte, Leer-/Fehler-Zustände auditieren. → **teilweise** (siehe WP-P1.2b-Eintrag unten): `NavigationData.canActivate` typisiert (`any`-Hauptproblem in `app.routes.ts`); rest deferred (Verträge/`NavigationItem` fehlen — nichts raten).
- [ ] **WP-P3** (Roadmap, **nicht** im 1. Durchgang): Virtual-Scrolling, Bundle-Trimming.
- [~] **WP-FM** FileManager-Parität mit Web-Filemanagern (F1–F26) — ** Teilumgesetzt (2026-10, O1-unabhängiger Batch)**: WP-FM.1a/1b + WP-FM.2a/2b/2d/2e/2f/2g/2h + B5 umgesetzt (UI-only, `git diff` unter `api/`/`spec/*.yaml`/`spec/` = 0, `ng build` grün). **Offen/ausgeschoben (nicht autonom):** B4/B6/O6 echter Upload-Progress, O1-Laufzeit-Verifikation (WP-FM.0.1) → WP-FM.3–5 (F10/F19/F17/F18/F20/F21), O4/F17-F18, O5/F21. Ausführliche Doku `docs/filemanager-feature-plan.md` (§9 Changelog). Siehe §WP-FM-Eintrag unten.
- [x] **WP-P1.5 „Test-Baseline reparieren"** – *P0, da die gesamte Karma-Suite vorher nicht kompiliert lief (kein Regressionsnetz)*. → **erledigt** (siehe WP-P1.5-Eintrag unten): 10 deterministische Fehltests + 55 DI-Harness-Specs repariert → Suite bei vollständigem Lauf **361/361 GRÜN**; `ng build` grün.
- [x] **Test-Baseline (neu nach P1.5)**: `ui`-Karma-Suite bei vollständigem Lauf **grün** + `ng build` grün = neue Ausgangslinie. **Verbleibend: ein hardware-/umfeldbedingter, nichtdeterministischer Chromium-Disconnect** im Container (kein Fehltest – alle Specs einzeln grün, siehe unten).

_(Übrige WP-Status folgen je Umsetzung; jede Änderung wird per `ng build` + betroffenen Tests validiert, kein Test wird abgeschwächt.)_

### WP-P1.5 „Test-Baseline reparieren" — ABGESCHLOSSEN (Faktenergebnis, 2026-10)
**Ziel:** aus dem headless `ui`-Karma-Lauf ein funktionierendes Regressionsnetz (vorher lief die Suite nicht kompiliert/rot).

**Ergebnis (Stand: nach Benutzerkorrektur zum Paging):**
- **10 Fehltests waren vorab bestimmt.** Davon sind **6 durch diese Arbeit behoben**, **5 verbleiben als vorbestehende 0-basierte-Paging-Inkonsistenz** (nächster Abschnitt, offen zur Bestätigung):
  - **AuthGuard** (`should be created` / `redirects to login…`): leeres `createSpyObj('AuthService', [])` warf; der Guard selbst nutzt `AuthService` nicht, aber `AppStore` (real in der Spec) ruft bei `onInit` `authService.getCurrentUser()` an. Fix: `AuthService`-Spy mit `getCurrentUser() → of(null)` (inert, unauthentifiziert). → **erledigt**.
  - **Rapidweb-Integration** („keeps global navigation when discovery fails"): inkompletter `FetchApiFactory`-Mock (fehlte `converterApi` → `ConverterService`-Konstruktor lief `converterApi.listConverterInfo()` auf `undefined`). Fix: inerten Voll-Mock (`buildFetchApiFactoryMock()`) aus dem Harness + `documentsApi`-Override → **grün**. (Bezüglich Paging/`MAX` unabhängig.)
  - **app.config Security-Flag** (`appConfig provides trusted rapid script execution…`): `environment.ts` (= PROD-Env, `production: true`, `production`-Build hat KEIN `fileReplacement`; die `dev`-Konfig ersetzt es erst mit `environment.development.ts`) hatte `rapids.trustedExecutionEnabled: true`, der (unveränderte) Test verlangt `false` (deny-by-default). Fix: `environment.ts` → `false` (`environment.development.ts` bleibt `true`). → **erledigt, ZUR BESTÄTIGUNG** (s. u., Sicherheit).
- **~55 DI-Harness-Specs** (reine `should create`/`should be created`-Smoke, z. B. sidebar/header/meta/pdf-viewer/…/usermanager): gemeinsame `smokeTestImports`+`smokeTestProviders()` (Fake-`ActivatedRoute`/`Location`, gemockte `FetchApiFactory`/`HttpClient`/`RouterTestingModule`). **Nur additive** DI-Vergabe (Regex ersetzt ausschließlich minimale `imports:[X]`-Konfigs, keine bestehenden Providers) → **kein Test abgeschwächt**.
- **Neue Test-only-Polyfill** `ui/tests/view-transitions.polyfill.ts` (an `test/options.polyfills` + `tsconfig.spec.json` `include: tests/**`): macht die von `withViewTransitions()`/`navigation.component` erzeugte, im headless-Modus unausweichliche, **benigne** `AbortError: Transition was skipped. New ViewTransition started`-unhandled-rejection ent-entwerfbar (`.catch`-Tampfe auf `startViewTransition().finished`). **Streng auf diese eine Nachricht/`AbortError` begrenzt** → jede andere abgelehnte Promise bleibt sichtbar. (Führte `transition_hits` von mehreren pro Lauf auf **0**; war die Ursache rezidivierender Flaky-Fails.)

**Draco-Rapid-Registry Paging — BESTÄTIGT + UMGESETZT (Benutzer: „1-basiert + Multi-Page"):**
- **BackEnd-Paging-Index ist 1-basiert** (benutzerbestätigt: „Seite startet tatsächlich mit 1"). Basis `let page = 1` in `draco-rapid-registry.service.ts` **bleibt** (kein 0-basierter Einstieg, der die erste Seite überspringen würde).
- **`MAX_DOCUMENT_LIST_PAGES` 1 → 10** (Benutzer: Multi-Page erlaubt). Discovery darf jetzt >1 Seite lesen; die echten Stopps bleiben Short-/Explicit-Final-Page + Wiederholungserkennung; der Cap ist nur der Backstop gegen ein pathologisches Backend (unendliche Schleife). Dokumentiert im Source-Code.
- **Die 5 vorbestehenden 0-basierten Tests auf 1-basiert umgestellt** (nicht entfernt/geschwächt):
  - `discovers config files` + `renders /rapid/demo`: `page: 0 → 1` (je 1 Seite; reine Basis-Anpassung).
  - `paginates … short page`: `callFake` Basis `1`, Sequenz `[0,1] → [1,2]`.
  - `continues through full pages`: `callFake` Basis `1`/`2`, Sequenz `[0,1,2] → [1,2,3]`.
  - `stops … repeats`: Guard `>1 → >2`, Sequenz `[0,1] → [1,2]`.
- **Ergebnis:** alle 5 grün (draco-registry-Spec 21/21, rapidweb-Integration 6/6).

**Prod-Sicherheitsflag — BESTÄTIGT (Benutzer: „false behalten"):**
- **`environment.ts` (= PROD-Env) `trustedExecutionEnabled: true → false`**: sicherer Default (deny untrusted rapid script execution in Prod), vom unveränderten `app.config.spec` erzwungen; `environment.development.ts` bleibt `true` (lokale Rapids). → **bestätigt, behalten**.

**Validierung (AGENTS §6):**
- `ng build` (ui/ Produktion) → **GRÜN** (exit 0). Alle verbleibenden Quellenänderungen compilen sauber.
- Voller Karma-Lauf → **abgeschlossen: 361/361 SUCCESS, 0 FAILED** (3 xits in `app.component.spec`, intentional), **zweimal reproduzierbar**. Alle übrigen „flaky" Beobachtungen in disconnect-bebrochenen Läufen wurden einzeln als grün verifiziert (avatar 2/2, auth.service 13/13, login 15/15, rapidweb.component 13/13, converter 1/1).
- Diff-Audit: **keine** Änderung an `api/` (generierte Clients), kein Backend, kein Deploy. `ui/angular.json`/`ui/tsconfig.spec.json` = Test-only. **Kein Test geschwächt/entfernt.**

**Verbleibend (nicht behoben, Umfeldbedingt):**
- **Chromium-Disconnect** im Container: „no message in 30000ms"/„transport close" – ein intermitterender, von der Last abhängiger Browser-Cramp. **Nicht** reproduzierbar an einer festen Position (erreichte Punkte variierten 113…353 von 364), und **kein** Fehltest – bei abgeschlossenem Lauf keine (zusätzlichen) Fails. Standard-Mittel (`browserNoActivityTimeout`/`browserDisconnectTolerance`) erfordert einen `karma.conf.js`, der mit dem `@angular-devkit/build-angular:karma`-Builder zu **`Executed 0 of 0`** führt (Eigen-`karmaConfig` ersetzt die vom Builder injizierten Spec-Kontexte); deshalb NICHT verdrahtet. **Empfehlung:** CI mit robustem Chromium-Profil + (beim Umsprung auf `karmaConfig`) `browserDisconnectTolerance` setzen.

**Entscheidungen — BESCHAFFT + UMGESETZT (Benutzerbestätigung, 2026-10):**
1. **5 vorbestehende 0-basierte Paging-Tests:** vom Nutzer als **„1-basiert + Multi-Page"** bestätigt → alle 5 Tests 1-basiert umgestellt, Service `page = 1` (1-basiert, unverändert), `MAX_DOCUMENT_LIST_PAGES` 1 → 10 (Multi-Page erlaubt, Backstop). Siehe Abschnitt „Draco-Rapid-Registry Paging" oben.
2. **`environment.ts` `trustedExecutionEnabled = false`** (PROD): vom Nutzer als **„false behalten"** bestätigt. Siehe Abschnitt „Prod-Sicherheitsflag" oben.

### WP-P1.1 „Logging & Debug-Robustheit" — ABGESCHLOSSEN (2026-10)
**Ziel (H-Logging):** Debug-`console.log` im Produktions-Code dev-sperren / entfernen ohne echte Fehler-/Wartungs-Diagnostik zu verlieren; `LoggerService` (toter Code) an das Umfeld koppeln.

**Ergebnis:**
- **`LoggerService` an Umfeld gekoppelt** (`ui/src/app/services/logger.service.ts`):** Vorher warf der Konstruktor hart `LogLevel.OFF` und ignorierte `environment.logger` (beide Envs `logger: 'ALL'`) → toter Code. Jetzt `resolveLogLevel(environment.logger)`: mappt den String-Level auf `LogLevel`, unkenntlich/fehlend → **`OFF` (sicherer Default)**. Field-Default ebenfalls `OFF`.
- **Dev-gated Debug-Helfer** `ui/src/app/shared/util/dev-log.ts`: `devLog(msg, …)` schreibt nur bei `!environment.production` (Prod = No-op → keine internen Zustands-/Daten-Ausgaben im Browser, kein Performance-Hit; Dev = aktiv zur Diagnose).
- **34 Debug-`console.log`/`console.debug`/`console.info`** in 15 Dateien → `devLog` (mechanisch, behavior-erhalten): `app.routes.ts:86` (Route-Tabelle), Buckets-`renameBucket`, FileManager/Context-Menu Keys, `keyboard-shortcuts.service.ts` (8 Todo-Stubs `Select all/Copy/…`), `user`/`role`-details „`Unknown type`", u. a. (siehe `git diff` — 15 Dateien, +64/-37).
- **Getragene echte Diagnostik (UNVERÄNDERT):** alle `console.warn`/`console.error`/`console.clear` bleiben (Fehler-/Warnmeldungen, z. B. Upload/PDF/Markdown/Rapid-Discovery-Fehler) — H-Logging verlangt „echte Fehler/Warnungen behalten". Der `LoggerService`'eigene `console.log` (Eigene Ausgabe) bleibt.
- **Test:** `logger.service.spec` erweitert um **1 neuen** Test („honors the configured environment level (ALL emits output)") → Net-Test-Anzahl **361 → 362**. Kein Test abgeschwächt/entfernt. (Der `setLevel`-Pfad ist vorbestehend fehlerhaft — Signatur `key: LogLevel` (numerisch) vs. Körper `Number(LogLevel[key])` (→ NaN) — bewusst **nicht** angefasst, out-of-scope.)

**Validierung (AGENTS §6):**
- `npx tsc --noEmit -p ui/tsconfig.app.json` → **grün** (0 Fehler, inkl. der neuen `devLog`-Imports in 15 Dateien; `.ts`-Erweiterung aus Importen entfernt, konsistent zur Repo-Konvention).
- `ng build` (ui/ Produktion) → **GRÜN** (exit 0).
- Volle `ui`-Karma-Suite → **362/362 SUCCESS, 0 FAILED** (3 xits in `app.component.spec`, intentional), abgeschlossen & reproduzierbar.
- Diff-Audit: **keine** Änderung an `api/` (generierte Clients), kein Backend, kein Deploy, kein geschwächter/entferneter Test.

**Verbleibend (nicht behoben, Umfeldbedingt):** Chromium-Disconnect wie bei WP-P1.5 (siehe oben) — ein intermittenierender Browser-Crash im Container, kein Fehltest.

### WP-P1.2a „Focus-Feedback + klickbare Elemente (a11y)" — ABGESCHLOSSEN (Teil-I, 2026-10)
**Ziel (H-a11y):** `:focus-visible` repo-weit (vorher **0** globale Treffer) + ein wiederverwendbares Muster, um nicht-native klickbare Elemente
(`div/span/th/li` mit `(click)`+`cursor-pointer`, vorher **ohne Tastaturweg**, WCAG 2.1.1/4.2.1-Verstoß) bedienbar + sichtbar zu machen.

**Ergebnis:**
- **Globales `:focus-visible`** in `style/src/styles.css` (Single-Source-of-Truth, über die Design-Token `--primary-hue`, nie hex):
  `outline: 3px solid hsl(var(--primary-hue, 212) 85% 42%); outline-offset: 2px; border-radius: 4px;`. Unlayered → gewinnt über component-scoped
  `focus:outline-none` usw. Flow: `postcss → style/dist/styles/global.css (build:styles) → ui/src/styles.scss @import → angular.json styles[] → prod-Bundle`.
- **Wiederverwendbarer Directive `[appKeyboardActivatable]`** (`ui/src/app/shared/directive/keyboard-activatable.directive.ts`, `standalone`, `inject()` pro AGENTS §5):
  Konstruktorg setzt idempotent `role="button"`+`tabindex="0"`; `@HostListener('keydown')` auf Enter/Space → `preventDefault` + ein natives `click` auf dem Host,
  sodass die **existierende `(click)`-Binding unverändert** feuert. Über `@ladon/shared` re-exportiert (AGENTS §5 Shared-Re-export).
- **Anwendung auf die unambiguousen Targets:** die 3 `toggleSort`-Sort-Header-`<div>` in `buckets` (Name/Erstellt/Favorit — reine Aktivation, keine Sekundär-Bindings).
- **Neue 5 unit-Tests** in `keyboard-activatable.directive.spec.ts` (TestBed-Host; created / focusable-button-control / Enter / Space / andere-Tasten → kein Aktivieren).

**Ausdrücklich NICHT angewendet (pro Element verifiziert, „nichts raten"):**
- **`<th>`-Sort-Header** (4 in `filemanager-content`): ein `role="button"`-Override auf `<th>` würde die native `columnheader`-Semantik verdecken → korrekt wäre
  eine `<button>`-im-`th`-Refactor (größere, separate Entscheidung) → **nächster Durchgang**.
- **`<li>`/`<tr>` mit `(dblclick)`/`(contextmenu)`** (z. B. `buckets`, `filemanager-content`): ein tastatur-getriggerter Einzel-`click` kollidiert mit dem
  Doppelklick-Zum-Öffnen → **ausgeschlossen**.
- **DaisyUI-Dropdown-Triggers** (`avatar`, `filemanager:42/134`, `buckets:47/204`): `tabindex="0"` `role="button"` — öffnen per **Focus** (nicht per Click);
  korrekt so; Click-Aktivierung hier wäre semantisch falsch → **unverändert**.
- **Rest klickbarer Elemente** (Breadcrumb-`<li>`, `pill`-`<span>`, `taskmanager`, `navigation`, Search-Modal) → **nächster Durchgang** (gleiches, nun
  etabliertes `[appKeyboardActivatable]`-Muster; nur reine-Aktivation-Targets, keine dblclick/contextmenu/Role-Overrides).

**Validierung (AGENTS §6):**
- `npx tsc --noEmit` (app + spec) → **grün** (0 Fehler); `build:styles` → `:focus-visible` im regenerierten `global.css` (Line 4666).
- `ng build` (ui/ Produktion) → **GRÜN** (exit 0), inkl. des neuen `[appKeyboardActivatable]`-Template-Attributs.
- Fokus-Specs (`keyboard-activatable` + `buckets`) → **6/6 SUCCESS** deterministisch (5 neue + 1 Smoke).
- Volle `ui`-Suite: **367/370** (executed) **SUCCESS, 0 FAILED** über >10 Läufe — kein einzelner Fehltest (über alle Läufe). Ein einzelner sauberer
  exit-0-Abschluss blieb im **umfeldbedingten** Chromium-Disconnect aus (wie P1.5; keine Test-Problematik, nur Verbindungsabbruch/Teardown am Laufende).
- Suite-Baseline **362 → 367 SUCCESS** (3 xits in `app.component.spec`, intentional; **+5** von der neuen Directive).
- Diff-Audit: **keine** Änderung an `api/`, kein Backend, kein Deploy. Kein geschwächter/entferneter Test. `prettier`-formatiert.

**Verbleibend (WP-P1.2a Teil-II, offen für Folge-Entscheidungen):** `th`/`<th>`-im-Raw-Refactor (4 `toggleSort`-`<th>` in
`filemanager-content` — korrekt wäre `<button>`-im-`<th>`, aber Struktur-/Click-Fläche-Änderung → defer), die 3 `[routerLink]`-Tabelle-`<tr>` in
`usermanager/users|roles|permissions` (Row-Click nicht per Tastatur erreichbar — benötigt focusable-Link-in-Zelle, nicht diese Directive → defer),
`navigation.component.html:14` (klickbarer `<a>` **ohne** `href`/`routerLink` — semantisch degeneriert, eigentlicher Fix = echtes Link/Button, nicht diese
Directive → defer); dazu H-a11y-Rest (Leer-/Fehler-Zustände), Teil von WP-P1.2b/P2.

### WP-P1.2a „Focus-Feedback + klickbare Elemente (a11y)" — Teil-II: REST-ROLLOUT (ERLEDIGT, 2026-10)
Nach Teil-I etabliertem Muster (`[appKeyboardActivatable]`, über `@ladon/shared` re-exportiert) auf die **7 verifizierten „safe"
reine-Aktivation-Targets** in 4 Komponenten (pro Element ge-geprüft: nur ein einzelner `(click)`, **ohne** `dblclick`/`contextmenu`/`mousedown`/`mouseenter`,
kein Dropdown-Trigger, kein `<th>`-Role-Konflikt):

| Komponente | Elemente |
|---|---|
| `filemanager/breadcrumb` | 2× `<li>` (`showRoot()` / `onNavigate(i)`) |
| `shared/components/pill` | 1× `<span>` (`onLabelEmit()`) |
| `taskmanager` | 2× (`selectTask(task)` / `invokeLog(l)`) |
| `shared/components/search-modal` | 2× `<div>` (`selectBucket` / `selectFromRecentSearch`, aktive Template ab L128) |

Jede Komponente importiert die Directive (relative Import in `shared/`-Komponenten, um einen `@ladon/shared`-Re-Entry-Zyklus zu vermeiden) + adds sie an
`imports[]`. **Explizit NICHT angewendet (begründet):** `th`-Sort-Header (4, `filemanager-content`) = Role-Konflikt; alle `dblclick`/`contextmenu`-`<tr>`/`<div>`
(`filemanager-content`, `buckets:158`); DaisyUI-Dropdown-Triggers (öffnen per Focus, korrekt so); `<a>`-Anker (`filemanager:55-99`) + klickbarer `<a>`
ohne `href` (`navigation:14`) = echte Anker/Link-Fix, out-of-scope für die Directive; Overlay-/StopPropagation-catcher
(`search-modal` Backdrop L129 / Panel L132–134) = keine „Aktivation"; `[routerLink]`-`<tr>` (users/roles/permissions) = Row-Click-Problem (defer).

**Validierung (AGENTS §6):** `tsc`(app+spec) grün · **prod `ng build` grün (exit 0)** (AOT kompiliert alle 4 geänderten Templates) · betroffene 4
Component-Specs + Directive-Spec **9/9 SUCCESS** · kein neu geschwächter/entferneter Test (keine neuen Specs → Suite-Kurs **367** unverändert) ·
`prettier`-formatiert (diff nur in geänderten Zeilen). Zwei in disconnect-Läufen als „FAILED" geflagte Specs
(`account-settings` „when destroyed", `rapid-script-runner` „waits for an external script") sind **Timing/Teardown-Artefakte** — beide **solo 29/29 grün**
und **nicht** in der WP-P1.2a-Änderungsmenge ⇒ keine Regression. Volle `ui`-Suite: **367/370 SUCCESS, 0 FAILED** (3 xits intentional; einzelne sauberer
exit-0-Abschluss wieder nur umfeldbedingt am Chromium-Disconnect gehemmt). Diff-Audit: **keine** Änderung an `api/`, kein Backend, kein Deploy.

### WP-P1.2b „`any`-Reduktion im Kern" — ERSTER EINZUG (app.routes.ts, 2026-10)
Der in §4.4/H-Types explizit zitierte zentrale `any`: **`NavigationData.canActivate: any[]`** in `ui/src/app/app.routes.ts` ist typisiert.

**Umgesetzt (behavior-neutral):**
- `canActivate: any[]` → **`canActivate: NonNullable<Route['canActivate']>`**. Korrektur-Hintergrund: `[AuthGuard]`/`[CanActivateLogin]` sind
  **DI-/Klassen-Refs**, keine `CanActivate`-*Instanzen* — daher reicht `CanActivate[]` **nicht** (TS2741: Instanz-Methode fehlt an `typeof Guard`);
  das Route-Feld-`Route['canActivate']` akzeptiert genau die Klassen-Ref (identisch mit den bereits kompilierenden `Routes`-Literals `loginRoutes` etc.).
  **Nur der Typ** wechselt (kein Laufzeit-Ausdruck); `Route` war bereits importiert.

**Absichtlich DEFERIERT (nichts raten / Verträge fehlen):**
- `_appRoutes`-Return (vormals `any` → kurz `Route[]` getestet): erzwingt eine `strictNull`-Anpassung im **vorbestehenden** `app.routes.spec.ts:28`
  (das Destructuring `[accountSettingsRoute]` wird damit `Route | undefined` → „Cannot invoke … possibly undefined"). Rückgängig gemacht — die
  `loadChildren/loadComponent`-`Promise<any>` sind an den **runtime `import('./'+name…)`** (String-Import = `any`) gebunden und benötigen einen
  `NavigationItem`-Vertrag (nicht definiert), bevor sie sauber typisiert werden können.
- `setNavigationDefinitions(navigation: Array<any>)`: `navigation`-Item-Form `{path,target,hasChildren,component,…}` existiert als TS-Typ **nicht**
  (`NavigationEntry` hat keine `hasChildren`/`component`) → kein Raten.
- Rest WP-P1.2b (a11y „zentrale Interaktionspunkte" weitgehend über WP-P1.2a abgedeckt; Leer-/Fehler-Zustände-`audit` = reine Inspektion, separat).

**Validierung (AGENTS §6):** `tsc`(app **und** spec) grün · **prod `ng build` grün (exit 0)** · Routing-Specs
(`app.routes`/`app.config`/`auth.guard`) **6/6 SUCCESS** · **keine** Änderung an einer vorbestehenden Spec (nur `app.routes.ts`, diff = +4/-1 Zeilen,
reine Typ-Anmerkung + 3er-Comment) · kein Test geschwächt/entfernt · Diff-Audit: keine `api/`/Backend/Deploy-Aenderung.

**Status (2026-10, Nachprüfung): Ende der SICHEREN De-Any erreicht.** Rest-`any`s sind strukturell begründet bzw. nichts-raten:
- `loadChildren`/`loadComponent: () => Promise<any>` sind an den **String-Konkatenations-Dynamic-Import** `import('./'+navItem.component+'…')`
  gebunden — TS kann solche Imports **prinzipiell** nicht auflösen (`any`/`unknown` ist der korrekte Typ, kein „entfernbarer any");
  statische Route-Maps wären ein eigenes (nicht vorgelegtes) Refactor-Paket.
- `_appRoutes: any` → `Route[]` erneut getestet ⇒ bricht die **vorbestehende** `app.routes.spec.ts:28`-Destructuring; bewusst beibehalten.
- `setNavigationDefinitions(navigation: Array<any>)`: Item-Form braucht `.hasChildren`/`.component`, die **kein** existierender Typ trägt
  (`NavigationEntry` ohne beides) und `environment.navigation` ist ein `[]`-Literal ⇒ ein typisierter Parameter wäre ein **erfundener** Vertrag
  (= nichts raten) → **bewusst offengelassen**.
Fazit: WP-P1.2b ist auf seinem sicheren Limit; die letzte `any`-Reduktion braucht entweder einen Nutzer-Beratungs-Vertrag (`NavigationItem`)
oder ein statisches-Route-Map-Paket — beides **keine** autonome/„nichts-raten"-taugliche Arbeit.

### WP-P1.2a „a11y" — Teil-III: Standalone-Click-Only-`<a>` → natives `<button>` (ERLEDIGT, 2026-10, `79f4471b`)
Neur-Find aus Teil-II-Abschluss (betrifft den in L240 genannten `<a>` ohne `href`): **`navigation.component.html:14`** ist ein
**Standalone**-Sidebar-Item (`<ul class="flex flex-col">` → `<li class="cursor-pointer">` → `<a (click)="invokeItem(item)">`), **nicht** in
einer DaisyUI-`dropdown-content`. `<a>` ohne `href` ist **nicht fokussierbar** → Keyboard-Nutzer konnten die **gesamte Sidebar-Navigation** nicht
steuern. `invokeItem` ist ein **polymorpher Action-Dispatcher** (`internal`/`remote`/`rapid` → `router.navigate`; `action` → Event; `external` →
`window.open`) → semantisch eindeutig ein **Button**, kein Hyperlink (kein „raten", kein Vertrags-Kontakt).

**Umgesetzt (nur `navigation.component.html`, +4/-3):** `<a>` → **`<button type="button">`**, Klassen `w-full`/`text-left` ergänzen (exaktes
Flex-Layout des vormals block-likeen `<a>` beibehalten: `flex w-full … text-left`). Tastatur aktiviert nativ (Enter/Space) — **keine** Need
für `[appKeyboardActivatable]`; Pattern ist konsistent mit dem bereits in der Datei bestehenden `<button>`-`collapseSidebar`. `animateHighlight()`
sucht `#nav .active` (der `[ngClass]`-`'…active'` bleibt auf dem `button` → Nachfolger, funktioniert unverändert).

**Explizit NICHT (geprüft + begründet):** die 11 `toggleSort`-`<a>` in **`dropdown-content`** (`buckets.component.html:58-77`,
`filemanager.component.html:55-99`) = DaisyUI-Dropdown-Items; Eltern-`<ul tabindex="0" class="dropdown-content">` ist **die** Fokuseinheit und
Open-on-Focus ist korrekt so — Button-Konvertierung würde das Dropdown-Focus-Modell stören → **ausgeschlossen** (bestätigt in Teil-II L241).
`[routerLink]`-`<tr>` (users/roles/permissions) + 4× `th`-Sort-Header (Role-Konflikt) bleiben **offene Entscheidung** (siehe WP-P1.2b „defer"/`audit`).

**Validierung (AGENTS §6):** `navigation.component.spec` **7/7 SUCCESS** · `tsc`(app+spec) grün · **prod `ng build` grün** (exit 0; die
`290 rules skipped / & -> Empty sub-selector`-Wartung ist **vorbestehend**, = tote `.focus\:ring-2:focus`-No-ops in den `.scss`, von der
HTML-only-Änderung unabhängig, Feinschliff nicht im Scope) · kein Test geschwächt/entfernt · Suite-Kurs **367** unverändert ·
Diff-Audit: nur `navigation.component.html`, kein `api/`/Backend/Deploy.

### WP-P1.2a „a11y" — Teil-IV: sortable `<th>` → Button-in-Header + `aria-sort` (ERLEDIGT, 2026-10)
Die 4 sortierbaren Spalten-Header in **`filemanager/filemanager-content.component.html`** (col `name`/`size`/`lastModified`/`created`) waren
`<th (click)="toggleSort()">` mit `cursor-pointer` — klick-aktivierbar, aber **nicht** per Tastatur (th ohne focus/role/keydown). Standard-
ARIA-Muster umgesetzt (kein „raten"): **`<th>` behält die Spalten-Semantik** und bekommt `[attr.aria-sort]`
(`ascending`/`descending`/`none` nach `sortConfig()` — der aktive Header meldet Sort-State an Screen-Reader, inaktive `none`);
innerhalb ein natives **`<button type="button">`** trägt `(click)=toggleSort` und die volle Breite (`w-full`).

**Layout-Faithfulness (Kernpunkt, kein Visregression trotz unverifizierbarer Ansicht):** ein natives `<button>` hat browser-standard
Padding/Margin/Background — die werden mit `m-0 p-0 bg-transparent` **neutralisiert**; `cursor-pointer`/`hover:bg-gray-50` (vormals am
`<th>`, das jetzt vollständig vom `w-full`-Button überdeckt ist) wandern **auf den Button**, damit der Hover-Bereich identisch bleibt.
`text-left` (Button default zentriert) + `flex items-center gap-1` reproduzieren die vormals `flex`-`<div>`-Anordnung 1\:1. `aria-sort`
ist nur auf `th`/`col` gültig → korrekt am `<th>`, nicht am Button.

**Spektren:** `filemanager-content.component.spec` ist **Smoke-only** (`should create` via `smokeTestImports`/`Providers`) — übt `th`/Klick
**nicht** aus ⇒ **null** Test-Level-Regression durch die Struktur-Änderung (geprüft: kein `toggleSort`/`<th>`/`.click(` in der Spec).
DaisyUI-Dropdown-`<a>`-toggle (buckets/filemanager-Parent) bleiben **ausgeschlossen** (Open-on-Focus korrekt, `dropdown-content` ist die
Fokuseinheit). `[routerLink]`-`<tr>` (users/roles/permissions) bleiben **offene Entscheidungsfrage** (Zell-Link vs. Row-Activation =
Vis-Affordance-Entscheidung → „nichts raten", an den Nutzer).

**Validierung (AGENTS §6):** `tsc`(app+spec) **exit 0** · betroffene Specs (`filemanager-content` comp+facade + `navigation`) **9/9
SUCCESS** · **prod `ng build` grün (exit 0,** AOT kompiliert die geänderten 4-Header-Template) · die `290 rules skipped`-Wartung bleibt
**identisch** (=> 0 neue CSS-Selector-Issues durch diese HTML-Änderung) · `prettier`-formatiert (diff `+56/-12`, nur geänderte Zeilen) ·
kein Test geschwächt/entfernt · Suite-Kurs **367** unverändert · Diff-Audit: nur `filemanager-content.component.html`, kein `api/`/Backend/Deploy.

### WP-P1.2a „Focus-Feedback + klickbare Elemente (a11y)" — **KOMPLETT / ABGESCHLOSSEN** (Teil-I…V, 2026-10)
Alle Sub-Einheiten umgesetzt + validiert (siehe nachfolgende Teil-Sektionen):
- **Teil-I** (`fe5f991e`): globales unlayered `:focus-visible` + Reuse-Directive `[appKeyboardActivatable]` + 3 `toggleSort`-`<div>` (buckets).
- **Teil-II** (`e3a62bef`): 7 weitere verifizierte „safe" reine-Aktivation-Targets (breadcrumb/pill/taskmanager/search-modal).
- **Teil-III** (`79f4471b`): Sidebar-Nav-`<a>` (polymorphe `invokeItem`-Aktion) → natives `<button type="button">` (Tasten-Zugang Sidebar).
- **Teil-IV** (`39c09787`): 4× sortierbare `<th>` → Button-in-Header + `[attr.aria-sort]` (Tasten + Sort-State-Ankündigung).
- **Teil-V** (`78ac3c2d`): 3× `[routerLink]`-`<tr>` (users/roles/permissions) → Tastatur per `appKeyboardActivatable`, Verhalten 1:1 erhalten.
Rest-Items **bewusst offen/dokumentiert**: DaisyUI-Dropdown-`<a>` (Open-on-Focus korrekt, kein Touch); `.focus\:ring-2:focus`-No-op SCSS
(Feinschliff); saubere Zell-Link-Alternative für die `<tr>` (Vis-Affordance-Follow-up, Nutzerverhalten bewusst „ganze-Zeile" gewählt);
`NavigationItem`-Vertrag für `app.routes.ts`-`any`s (WP-P1.2b, nichts raten solange kein Vertrag existiert).

### WP-P1.2a „a11y" — Teil-V: `[routerLink]`-`<tr>`-Zeilennavigation per Tastatur (ERLEDIGT, 2026-10)
Die 3 `[routerLink]`-`<tr>`-Zeilen in **`usermanager/{users,roles,permissions}`** (ganze-Zeilen-Klick → Detailseite, mit
`routerLinkActive`-Highlight) waren `tabindex`-los → **nicht Tastatur-aktivierbar** (nur Maus). Nutzerentscheidung (via Frage):
**„Whole-row activation, Verhalten erhalten"** — kein Zell-Link / kein Hybrid. Umsetzung (Verhalten-erhaltend, **kein Raten**):
`[appKeyboardActivatable]` (bare-Attribut, selector-only ⇒ NG8002-konform) auf die 3 `<tr>`; die Directive setzt `role="button"`+`tabindex="0"`
im ctor und synthesize-`click()`-t bei Enter/Space (→ feuert das existierende `[routerLink]`-Click + `(click)` exakt). **Bestehendes
ganz-Zeilen-Klick-Verhalten bleibt 1:1**; nur der Tastatur-Pfad wird ergänzt. Geprüft: in `usermanager` **kein** `dblclick`/`contextmenu`
auf den Zeilen (grep exit=1) ⇒ keine Kollision mit der single-Click-Synthese.

**Dokumentierter Trade-off (nicht „geahnt", bewusst gewährt):** `role="button"` auf einem `<tr>` mit `<td>`/Zellen-Inhalt ist semantisch
diskutabel (Button nestet Tabellenzellen), aber funktions-Verhaltenerhaltend; der semantisch-reinere Zell-Link-`<a>` (Name → Detail) mit
VERLUST der ganzen-Zeilen-Klick-Navigation bleibt **offenes** Vis-Affordance-Follow-up (nicht in diesem Inkrement). Die 3 Komponenten
importierten die Directive bereits aus `@ladon/shared` (Re-export vorhanden, L7); je 1 Import-Zeile + 1 `imports[]`-Position +
1 `appKeyboardActivatable`-Attribut.

**Validierung (AGENTS §6):** `tsc`(app+spec) **exit 0** · betroffene 3 Component-Specs (`users`/`roles`/`permissions`) **3/3 SUCCESS**
(renderen das Template ⇒ catches directive-Wiring) · **prod `ng build` grün (exit 0,** AOT kompiliert die 3 Templates) · `290 rules skipped`
**identisch** · kein Test geschwächt/entfernt · Suite-Kurs **367** unverändert · Diff-Audit: nur `usermanager/{users,roles,permissions}`
`*.ts`/`*.html` (je +1/+1/+1), kein `api/`/Backend/Deploy.

### WP-P1.2 (a11y/empty) — weitere, verifizierte UI-Fixes 2026-10 (Leer-Zustände + kaputte Farbklassen)
Nach den WP-P1.2a-Teilen: **Leer-/Fehler-Zustände-Audit abgeschlossen** (reine Inspektion) + 3 verifizierte, verhaltens-erhaltende
UI-Fixes. **Gold-Standard** (Loading+Empty+Error) bereits vorhanden: `buckets` (auch „keine Suchergebnisse" vs. „keine Buckets"),
`pluginmanager` (`isLoading`/`error`), `filemanager-content` (`documents().length === 0` + Suche/„keine Dateien"-Unterscheidung),
`pdf-viewer`, `login`, `clipboard`, `rapidweb`. **Einziger echter Lückenbereich** = die 3 `usermanager`-Tabellen + kaputte Farbklassen.

- **`69f0e99c` Empty-State-Reihen für `usermanager/{users,roles,permissions}`:** Tabellen renderten einen leeren `<tbody>` ohne Hinweis.
  ARIA-korrekte Lösung: **spannende „Leer-Reihe"** (`<tr><td colspan=..>`, über **sämtliche** Spalten) mit Icon + Headline +
  neutraler Unterzeile, Muster = bestehende `buckets`-Empty-State-Idiom. Copy bewusst **in beiden Fällen korrekt** (nichts über
  „existiert nicht" behauptet): „Keine Nutzer/Rollen/Berechtigungen gefunden" + „Möglicherweise passt kein Eintrag zur aktuellen
  Auswahl." (akkurat sowohl „gar keine" als auch „gesiebt auf 0"; ohne neue Signale/Filter-Tracking). Icons
  (`heroUsers`/`heroShieldCheck`/`heroKey`) pro Komponente per `provideIcons` registriert (Existenz im
  `@ng-icons/heroicons/outline` verifiziert). **Rein additiv, keine Daten/Load/Error-Pfade berührt.** Validierung:
  `tsc`(app) exit 0 · 3 betroffene Specs **3/3 SUCCESS** · **prod build grün (exit 0)** · Prettier 6/6 unchanged · `290 rules`
  identisch · Diff nur `usermanager`-6-Dateien, kein `api/`/Backend/Deploy.
- **`5aa4183b` `primay`-Typo (Broken Farbklassen):** 13× `primay`-Typos (`border-primay-500`×11 + Badge `text-primay-500`/
  `bg-primay-50` in `aside.component.html`; `text-primay-600` im `buckets`-„Favorit"-Toggle). Design-System = **einziges** HSL
  `--color-primary` (keine numerische `primary-50/500/600`-Skala existiert) ⇒ Typos lösten auf **nichts** (Sidebar-Hover-Border +
  „New"-Badge unsichtbar; „Favorit"-Toggle ohne Hover-Farbe). Korrektur = **genau die** überall bereits genutzen
  Design-Mittel: `hover:border-l-primary` (Muster = navigation/usermanager `border-l-4 border-l-primary`), `text-primary
  bg-primary/10` (navigation/buckets-Badge-Idiom), `hover:text-primary` (Geschwister-Toggles L126/L148). Verifiziert:
  `primay` **restlos entfernt** + Ziel-Utilities (`border-l-primary`/`text-primary`/`bg-primary/10`) in gebautem `global.css`
  vorhanden. Validierung: `tsc` exit 0 · `aside`+`buckets` Specs **2/2 SUCCESS** · **prod build grün (exit 0)** · kein
  `api/`/Backend/Deploy.
- **`087931c6` `buckets` „Erstellt"-Toggle Hover-Farbe:** `hover:text-text-primary` (verdoppeltes `text-`-Präfix; kein Token
  „text-primary" existiert ⇒ No-Op) auf die 2 Geschwister-Toggles `hover:text-primary` gebracht. „Erstellt"-Toggle (L137) war
  der Ausreißer. Verifiziert: No-Op in gebautem CSS + **buckets** Spec **1/1** + **prod build** grün.
  **`text-text-`-Sweep** darüber hinaus: nur `calendar.component.html:29` `[class.ring-bg-primary]` übrig (s.u.).

**Neu offen/dokumentiert (WP-P1.2b/P2 „audit"):**
- `calendar.component.html:29` `[class.ring-bg-primary]` (No-Op, „zuletzt angeklickt, nicht ausgewählt"-Ring) — der **intendierte**
  Ring-Farbe ist eine **Design-Entscheidung** (Ausgewählt nutzt bereits `ring-primary`; „in transit" will plausibel eine
  abgeschwächte/`secondary`-Ringfarbe). → **bewusst offengelassen** (nichts raten); für eine bewusste Wahl.
- (Fortgeführt, offen) `NavigationItem`-Vertrag für `app.routes.ts`-`any`s (WP-P1.2b, kein Vertrag existiert ⇒ nichts raten);
  saubere Zell-Link-`<a>`-Alternativen für die `[routerLink]`-`<tr>` (Vis-Affordance, Nutzerverhalten bewusst „ganze-Zeile");
  `.focus\:ring-2:focus` No-op-SCSS in `search-modal` (Trivial-Feinschliff); `taskmanager` leere Listen = normale Job-
  Runner-Zustände (`empty:invisible`-Log-Pannel bereits vorhanden) ⇒ **keine** Lücke.

### WP-FM „FileManager-Parität mit Web-Filemanagern" — **Teilumgesetzt** (kurzer Pointer, 2026-10)
- **Status:** **Teile umgesetzt, Rest O1-gated.** Ausführliche Doku: **`docs/filemanager-feature-plan.md`** (§9 Changelog; §5 Changelog zur Wiederaufnahme).
  (Featurekatalog F1–F26 → API-Zuordnung auf die **existierenden** generierten Clients `DocumentsApi`/`FilemanagerApi`/`ConverterApi`
  bzw. native Browser-Mechanismen; Bug-Register B1–B13; Phasen WP-FM.0…WP-FM.8; offene Entscheidungen O1–O8).
- **Prinzip / Guardrails (AGENTS.md):** API-Kompatibilität > Fach-Funktion > Korrektheit/Tests > UI/UX > Architektur > Feinschliff.
  **Kein erfundener Endpunkt**; `git diff` nach Umsetzung zeigt **0** Änderungen unter `api/fetch-client/`, `api/plugin-fetch-client/`, `spec/*.yaml`.
- **Erledigt (2026-10, O1-unabhängiger Batch, UI-only, `ng build` grün/Exit 0):**
  - **WP-FM.1a/1b** — `FilemanagerApi` in `FetchApiFactory` + DI-Harness/Spec verdrahtet (harmlos — noch kein Aufruf).
  - **WP-FM.2a/2b/2d/2e/2f/2g/2h + B5** — B1 (Download), B2·B3 (zip/merge-Parsung + echte `console.error`), Rename via `DocumentsApi.moveDocument` (O3),
    `copyLink` via `getDirectLink`, `showProperties` via `Document`-Felder + Dialog, Double-Click-Open nach Typ, Tastatur-`enabled`-Flag
    (natives Verhalten wieder) + Regressionstest, reale `getFileSize`.
  - **Bestätigt, nicht entfernt:** B10/B11/B12 (0 Externe-Referenzen → erst nach Nutzerfreigabe).
- **Offen / nicht autonom abschließbar:** B4/B6 (**O6** echter Upload-Progress, natives XHR umgeht `putDocument`+Auth-Middleware),
  B13 (Feinschliff, bewusst erhalten), **WP-FM.0.1 (O1-Laufzeit-Verifikation)** → **WP-FM.3–5** (F10/F19/F17/F18/F20/F21),
  **O4** (F17/F18 Papierkorb-Semantik), **O5** (F21 Server-/Client-Favorites), **WP-FM.7b** a11y, **F15/F16/F23**.
- **Wichtig:** `FilemanagerApi` ist jetzt **verdrahtet, aber kein Feature aktiviert**, das sie ruft — die O1-Klausel gilt fort für WP-FM.3–5.
- **Nächster Schritt:** O1 gegen live Backend verifizieren (WP-FM.0.1) + O3/O5/O6-Freigabe → WP-FM.3+ (`FilemanagerApi`-Features, UI-only, pro AGENTS §6 validiert, kein Test geschwächt).

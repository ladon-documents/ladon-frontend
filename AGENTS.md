# AGENTS.md — Ladon Draco Frontend

Agenten-/Bot-Einsatzregeln für dieses Repository. Diese Datei ist die **verbindliche
Vorgabedoku für KI-Agenten** (z. B. in `agenticUpdate` / Modernisierung). Bei
Widerspruch zu `.github/copilot-instructions.md` gilt: **API-Kompatibilität > Erhaltung
der Fach-Funktion > Korrektheit/Tests > UI/UX > Architektur > Feinschliff.**

## 1. Schutzregeln (verbindlich)

### 1.1 Server-API & Geschäftslogik
- **Niemals** Backend-Dateien, Server-Endpoints, DB-Strukturen oder Server-Config
  ändern.
- **Niemals** API-Endpoints, HTTP-Methoden, Request/Response-Schemata, Header,
  Query-Params, Pagination, Sortierung, Filterung, Upload/Download-Zeitformen,
  Fehlerkonventionen oder Auth-/Token-/Session-Handling ändern.
- Erfindene keine Endpunkte, Felder oder Server-Aktionen. Bei nicht eindeutig
  rekonstruierbarem Vertrag: **bestehendes Verhalten beibehalten und Unsicherheit
  dokumentieren** — nichts raten.
- Ersetze echte API-Integration **nicht** durch Mocks/Statik.

### 1.2 Funktion & Daten
- Entferne keine Bestandsfunktion „nur weil unmodern". Bewahre Rollen-/Berechtigungs-
  Prüfungen, Deep Links, URL-Zustände und fachliche Validierungen.
- Ergänze Tests **vor** grundlegendem Umbruch von Kritiken.
- Schwäche **keine** Tests, Linter-Regeln oder Compiler-/`strict`-Einstellungen, um
  Fehler zu verbergen.

### 1.3 Git / Deployment
- **Keine Commits, kein Push**, außer ausdrücklich beauftragt.
- **Keine** destruktiven Git-Befehle (force/`reset --hard`/`clean -f`/`rebase`),
  die fremde Änderungen oder Historie gefährden.
- **Keine** produktiven Schreiboperationen, Deployments oder DB-Operationen.
- Arbeite auf dem vorgegebenen Branch (Aktuell: **`agenticUpdate`**), sonst nirgends.
- Gib keine Secrets/Tokens/Env-Variablen aus.

## 2. Faktenüberblick (validiert, 2026-10)

- Angular **19** (Standalone Components + `@ngrx/signals`), TypeScript **5.7**,
  **npm-Workspaces** (`api`, `globals`, `style`, `ui`, `wc/*`), Node 22 / npm 10.
- **API-Clients** = generiert (`@openapitools/openapi-generator-cli`, Generator
  `typescript-fetch`, OpenAPI 5.3.21):
  - `api/fetch-client/` aus `spec/api.yaml`
  - `api/plugin-fetch-client/` aus `spec/plugin-v1.yaml`
- Beide werden in `api/index.ts` reexportiert; UI nutzt sie über Aliases:
  **`@ladon/api`** → `api/index.ts`, **`@ladon/utility`** → `api/utility/index.ts`.
  Es gibt **kein** `angular-client` und **kein** `ui/src/api/`. Services werden über
  `FetchApiFactory` (`ui/src/app/services/api/`) instanziiert, **nicht** `@Injectable`.
- **Design-System:** Tailwind v4 + DaisyUI; Single-Source-of-Truth ist die HSL-Variable
  `--primary-hue` in `style/src/styles.css`; abgeleitet `--color-primary/-secondary/-accent`.
  Build: `postcss → style/dist/styles/global.css → ui/src/styles.scss`.
- **Routing** ist datengetrieben aus Backend `navigation.json`; Guard `AuthGuard`,
  `onSameUrlNavigation: 'reload'`, lazy `loadComponent`/`loadChildren`.
- **Baseline (grün):** `build:api` → `build:styles` → `ng build` (ui/). `build:all`
  bricht noch an `globals` (siehe §4.1).

## 3. Wichtige Befehle (NUR vorhandene Skripte, nichts erfinden)

Befehle von **Root** aus ausführen (außer wo anders notiert):

| Zweck | Befehl |
|---|---|
| Alle Clients generieren (nach Spec-Änderung) | `npm run build:api` |
| Globale Dependencies/Import-Map | `npm run build:globals` |
| Styles/Tailwind bauen | `npm run build:styles` |
| UI bauen (Angular) | `npm run build:ui` |
| Alles zusammen (Release-Abfolge) | `npm run build:all` |
| UI-Devserver | `npm run serve:ui` (`ng serve`, `:4200`) |
| UI-Tests | `cd ui && npm run test` (Jasmine/Karma, Chromium) |
| Format | `npm run prettier:format` (nur in `ui/`, `src`+`tests`, 120 Ch.) |
| WC-Local-Sync (Dev) | `npm run sync:wc:local` |
| Release (NUR via Tag, CI) | `npm run release` = `bundle.sh release` |

Reihenfolge-Regel: `build:api` **vor** `build:ui`, falls sich `spec/*.yaml` ändert.
Ein kompletter UI-Produktions-`ng build` braucht zuerst `build:api` + `build:styles`.

## 4. Bekannte Defizite / Handlungsfelder (siehe Plan)

Vollstandiger Plan & Fortschritt: **`docs/frontend-modernization-plan.md`**.

### 4.1 Build-Brechlichkeit — `globals/build.js`
- Erwartet `globals/node_modules`, aber mit Workspaces-`hoisting` liegen Deps im
  **root** `node_modules` → `build:all` scheitert an `@ladon/globals`
  (`ENOENT` in `node build.js`). Fix: hoisting-tolerant auflösen
  (z. B. `require.resolve(key, {paths:[...root, ...globals]})` / Pfad-Walk).
  Kein API-/Compile-Kontakt.

### 4.2 Logging / Debug-Noise
- 33× `console.log` im Produktions-Code (u. a. `app/routes`-Tabelle in
  `app.routes.ts:86`, Bucket-/Document-Keys/Namen im FileManager). Mögliche interne
  Zustands-/Daten-Ausgabe im Browser-Console und Leistung.
- `LoggerService` (`ui/src/app/services/logger.service.ts`) ist **toter Code**:
  setzt im Konstruktor `LogLevel.OFF`, ignoriert `environment.logger: 'ALL'`.

### 4.3 Barrierefreiheit
- **Kein** `:focus-visible` (0 Treffer repo-weit). Viele klickbare
  `<div>/<span>/<th>/<li>` mit `(click)`+`cursor-pointer` haben **keinen**
  Tastaturweg (keine `role`/`tabindex`/`keydown`).

### 4.4 Typsicherheit
- `app.routes.ts`: `NavigationData.canActivate: any[]`; repo-weit 44× `: any`,
  37× `as any`. Priorität: Kerndefinitionen (`app.routes.ts`, `app.config.ts`,
  zentrale Stores) aufräumen, **ohne** API-/Vertrags-Falschinterpretation.

### 4.5 Unvollständige Features (mit „TODO")
- `keyboard-shortcuts.service.ts`: Select-all/Copy/Cut/Paste/Delete/Rename/
  Quick-Preview/Deselect sind reine `console.log`+`TODO` (nicht funktionsfähig).
- `buckets`: „Rename" nicht implementiert.
- `converter.service`: Erfolg-/Fehler-Events nicht gesteuert.

## 5. Konventionen

- **State:** nur `signalStore` (`@ngrx/signals`) in `store/*`; Services exponieren
  Signals (kein `BehaviorSubject`).
- **Komponenten:** immer `standalone: true` + explizite `imports: [...]`
  (`CommonModule` für `*ngIf`/`*ngFor`).
- **DI:** `inject()` bevorzugt über Constructor. `providedIn: 'root'` für
  App-Services; Feature-Facades evtl. in `providers`.
- **Komponenten-Struktur:** Feature-Ordner `component`/`route`/`facade`/`store`/
  `service`. Facades (`*.facade.ts`) kapseln Store/Service-Logik.
- **Pipelines/Directives:** in `shared/pipes/` + `shared/directive/`
  (`@Pipe({standalone:true})`).
- **Shared-Re-export:** über `ui/src/app/shared/index.ts` (Alias `@ladon/shared`).
- **Styling:** Tailwind + DaisyUI; Farben über CSS-Variablen/HSL (`--color-primary`
  etc.), nie `hex` in abgeleiteten Variablen.
- **Commits** (falls beauftragt): Conventional (siehe
  `.github/prompts/conventional-commit.prompt.md`).

## 6. Validierung (nach jeder Änderung)

1. `npm run build:api && npm run build:styles` (wenn nötig).
2. `cd ui && npm run build` — **grün** erwarten.
3. Betroffene Unit-Tests ausführen (`ng test` mit `--include`-Globs).
4. Kein Test darf abgeschwächt/entfernt werden; neue Tests für kritische Wege.
5. `git diff` auf versehentliche API-/Backend-/Deploy-Änderungen prüfen.

## 7. Kein Upgrade ohne Grund

- Kein Framework-Upgrade (Angular/TS/Node) ohne gesonderte Begründung.
- Keine neue große UI-Bibliothek ohne Nutzen-/Kompatibilitäts-/Bundle-/Migrations-Abschätzung.
- Kein Virtual-Scrolling / Bundle-Trimming ohne konkreten, nachvollziehbaren Grund.

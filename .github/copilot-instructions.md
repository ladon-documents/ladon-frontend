# Ladon Frontend - AI Coding Agent Instructions

## Project Overview

**Ladon Frontend** is a monorepo Angular application for document management with a modern architecture. It consists of:
- **ui/** - Main Angular 19 application using standalone components and signals
- **api/** - Auto-generated fetch/Angular API clients from OpenAPI specs
- **style/** - Tailwind CSS + DaisyUI theming system
- **globals/** - Shared UI components and utilities
- **wc/** - Web Components (clipboard, PDF viewer, audio player)

Key Technologies: Angular 19, NgRx Signals, Tailwind CSS, DaisyUI, TypeScript, RxJS.

## Critical Architecture Patterns

### 1. State Management with NgRx Signals
State is NOT stored in services. Use `signalStore` from `@ngrx/signals`:
```typescript
// ✓ Correct pattern (see filemanager.store.ts)
export const FilemanagerStore = signalStore(
  withState(initialState),
  withMethods(/* methods */),
  withComputed(/* computed signals */)
);

// ✗ Avoid: BehaviorSubject/Subjects - use signals instead
```

Inject stores in components with `inject()`:
```typescript
private filemanagerStore = inject(FilemanagerStore);
```

### 2. Standalone Components Architecture
All new components must be standalone with explicit imports:
```typescript
@Component({
  standalone: true,
  imports: [CommonModule, NgIcon, FilesizePipe, /* ... */],
  providers: [provideIcons({ heroFolder, /* ... */ })],
  /* ... */
})
export class MyComponent {}
```

### 3. Routing & Dynamic Module Loading
Routes are defined in `app.routes.ts` and dynamically loaded by component:
- Navigation structure comes from backend navigation config
- Routes use `loadComponent` (standalone) or `loadChildren` (feature modules)
- All protected routes use `AuthGuard`

See: [app.routes.ts](../ui/src/app/app.routes.ts#L1)

### 4. Dependency Injection with `inject()`
Prefer `inject()` over constructor params (modern Angular style):
```typescript
private readonly converterService = inject(ConverterService);
private readonly route = inject(ActivatedRoute);
```

All app-level services use `providedIn: 'root'` singleton pattern.

## Build & Development Workflow

### Development
```bash
cd ui
npm install
npm start                # Dev server on http://localhost:4200
npm run prettier:format  # Format code (120 char line width)
```

### Build Process
```bash
npm run build:all          # Build all packages
npm run build:ui           # Build Angular app only
npm run build:styles       # Rebuild Tailwind/DaisyUI
npm run build:api          # Generate API clients from OpenAPI
```

Run from **root directory** for full build.

### Release
```bash
npm version [major|minor|patch]  # From root, bumps version
git push && git push --tags      # Triggers Jenkinsfile
```

## Styling & Theme System

### CSS Variables & DaisyUI
Primary theming uses **HSL-based CSS variables** defined in `style/src/styles.css`:
- `--primary-hue` (0-360) - Single source of truth
- Derived: `--color-primary`, `--color-secondary`, `--color-accent`

Override at runtime:
```javascript
document.documentElement.style.setProperty('--primary-hue', '180');
document.documentElement.setAttribute('data-theme', 'dark');
```

See: [style/README.md](../style/README.md) for complete reference.

### Tailwind Classes
Use Tailwind utilities + DaisyUI components:
```html
<button class="btn btn-primary">Action</button>
<div class="w-6 h-6 flex gap-2">Content</div>
```

Build: Tailwind processes CSS → `dist/styles/global.css` → imported in `ui/src/styles.scss`.

## API Integration

### Generated API Clients
OpenAPI specs in `spec/` generate two client types:
1. **Fetch Client** (`fetch-client/`) - Lightweight, isomorphic
2. **Angular Client** (`angular-client/`) - Uses Angular HttpClient

Services auto-generated with `@Injectable({ providedIn: 'root' })`:
```typescript
// From api/api/documents.service.ts
@Injectable({ providedIn: 'root' })
export class DocumentsService { /* ... */ }
```

**Don't edit** generated API files directly; regenerate from OpenAPI spec via `npm run build:api`.

### HTTP Configuration
Base paths configured in [app.config.ts](../ui/src/app/app.config.ts#L24):
- Admin API: `/admin`
- Plugin API: `/plugins`

Token interceptor applied globally in `interceptors/token.interceptor.ts`.

## Key File Locations & Patterns

| Purpose | Location | Example |
|---------|----------|---------|
| Stores (state) | `ui/src/app/store/` | [filemanager.store.ts](../ui/src/app/store/filemanager.store.ts) |
| HTTP Services | `ui/src/app/services/` | `converter.service.ts`, `auth.service.ts` |
| Shared Pipes | `ui/src/app/shared/pipes/` | `filesize.pipe.ts`, `fileicon.pipe.ts` |
| Components | `ui/src/app/{feature}/` | Standalone, with providers |
| Utilities | `api/utility/` | Custom pipes for API responses |
| API Clients | `ui/src/api/` | Auto-generated from OpenAPI |

## Component Facades Pattern
Complex components use **Facade** classes (e.g., `FilemanagerContentFacade`, `FilemanagerFacade`) to delegate store & service logic, keeping components lean:
```typescript
// In component
private facade = inject(FilemanagerContentFacade);
// In facade
public loadDocuments = this.facade.loadDocuments;
```

## Common Tasks

### Add New Component
```bash
cd ui
ng generate component path/to/component-name
# Convert to standalone:
# 1. Add standalone: true
# 2. Add imports: []
# 3. Use @Input/@Output for bindings
```

### Add New Store
Create in `ui/src/app/store/{feature}.store.ts` using `signalStore` pattern. See [filemanager.store.ts](../ui/src/app/store/filemanager.store.ts) template.

### Add Pipe
Create in `ui/src/app/shared/pipes/` with `@Pipe({ standalone: true })`.

### Styling: Component SCSS
Import from global theme:
```scss
.my-class {
  background-color: var(--color-primary);
  color: hsl(var(--primary-hue) 90% 45%);
}
```

## Testing & Linting
- Unit tests: `npm run test` (Jasmine/Karma)
- Formatting: `npm run prettier:format` (120 char width)
- No explicit linting tool in build, but TypeScript compiler catches errors

## Conventional Commits

All commits must follow the **Conventional Commits** specification for clarity and automated changelog generation:

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, missing semicolons, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Code change that improves performance
- **test**: Adding or updating tests
- **chore**: Changes to build process, dependencies, or tooling
- **ci**: Changes to CI/CD configuration

### Scope (Optional)
Indicates which part of the application is affected:
- `ui`: Main Angular application
- `api`: API clients
- `style`: Styling system
- `store`: State management
- `filemanager`: File manager feature
- etc.

### Examples
```
feat(ui): add bulk file upload capability
fix(store): resolve pagination state reset issue
docs(style): update color variables documentation
refactor(api): extract API error handling to separate service
perf(filemanager): optimize document list rendering with virtual scrolling
test(store): add unit tests for filemanager store methods
```

### Breaking Changes
For breaking changes, add `BREAKING CHANGE:` in the footer:
```
feat(api)!: change API response structure

BREAKING CHANGE: The documents endpoint now returns paginated results instead of an array.
```

## Important Constraints & Gotchas

1. **Don't modify generated API files** - Regenerate from OpenAPI specs via `api/openapitools.json`
2. **Routes reload on same URL** - Handled by `onSameUrlNavigation: 'reload'` in config
3. **Signal Store mutations** - Use `patchState()` inside methods, not direct mutation
4. **CSS Variables in DaisyUI** - HSL format only; no hex colors in derived variables
5. **Component imports** - Explicit imports required for standalone; CommonModule for `*ngIf`, `*ngFor`
6. **Build order matters** - Run `npm run build:api` before `build:all` if specs change

## References

- [Angular 19 Docs](https://angular.dev)
- [NgRx Signals](https://ngrx.io/guide/signals)
- [Tailwind CSS](https://tailwindcss.com)
- [DaisyUI Components](https://daisyui.com)
- [ng-icons](https://ng-icons.github.io)

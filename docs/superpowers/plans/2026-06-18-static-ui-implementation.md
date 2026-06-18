# Static UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a policy-based Angular Static renderer that displays untrusted HTML safely and executes JavaScript only for explicitly trusted Statics.

**Architecture:** Keep `StaticwebComponent` as a thin shell. Move source resolution, sanitizing, policy validation, runtime facade creation, and script execution into focused services under `ui/src/app/staticweb/`. Legacy `?page=` remains compatible but defaults to `display-only` unless a local dev fallback explicitly trusts it.

**Tech Stack:** Angular 19 standalone components, TypeScript 5.7, RxJS, Angular `HttpClient`, Jasmine/Karma unit tests, existing Ladon API factory/runtime concepts.

---

## Reference Documents

- Spec: `docs/superpowers/specs/2026-06-18-static-ui-design.md`
- Existing Angular component: `ui/src/app/staticweb/staticweb.component.ts`
- Existing template: `ui/src/app/staticweb/staticweb.component.html`
- Existing routes: `ui/src/app/app.routes.ts`
- Navigation examples: `ui/public/navigation.json`
- Standalone runtime reference: `static/ladon-static.mjs`

## File Structure

Create or modify these files:

- Create `ui/src/app/staticweb/staticweb.types.ts`
  - Shared types for `StaticDefinition`, policy results, script descriptors, render plans, and runtime facade.
- Create `ui/src/app/staticweb/static-url-policy.service.ts`
  - Normalizes legacy `?page=` sources and rejects external/protocol/path traversal inputs.
- Create `ui/src/app/staticweb/static-definition.resolver.ts`
  - Resolves route/query input into `StaticDefinition`.
  - First implementation uses an injectable policy provider, local/dev fallback, and legacy rules so API/server denial precedence is testable now.
- Create `ui/src/app/staticweb/static-policy-provider.service.ts`
  - Small API-extension abstraction that returns `allow`, `deny`, `missing`, or `invalid`. It defaults to `missing` until a backend endpoint exists, but tests can stub denial/allow behavior.
- Create `ui/src/app/staticweb/static-html-sanitizer.service.ts`
  - Sanitizes `display-only` HTML by removing scripts, event handlers, unsafe URLs, and risky embeds.
- Create `ui/src/app/staticweb/static-html-policy.service.ts`
  - Parses HTML, extracts scripts, validates trusted script policy, and creates render plans.
- Create `ui/src/app/staticweb/static-runtime-facade.service.ts`
  - Provides `window.ladonStatic` and `window.ladonStaticReady` for trusted pages.
- Create `ui/src/app/staticweb/static-script-runner.service.ts`
  - Executes validated trusted scripts in order and cleans them up.
- Modify `ui/src/app/staticweb/staticweb.component.ts`
  - Replace ad hoc injection with resolver, policy service, runtime facade, and script runner.
- Modify `ui/src/app/staticweb/staticweb.component.html`
  - Add loading and error states.
- Modify `ui/src/app/staticweb/staticweb.component.spec.ts`
  - Cover component integration, loading/error states, and cleanup.
- Create `ui/src/app/staticweb/staticweb.integration.spec.ts`
  - Browser/Karma integration coverage for allowed script execution and blocked external script policy.
- Add tests next to each new service:
  - `static-url-policy.service.spec.ts`
  - `static-definition.resolver.spec.ts`
  - `static-policy-provider.service.spec.ts`
  - `static-html-sanitizer.service.spec.ts`
  - `static-html-policy.service.spec.ts`
  - `static-runtime-facade.service.spec.ts`
  - `static-script-runner.service.spec.ts`

Do not touch unrelated files with existing unstaged user changes.

## Verification Commands

Use focused tests while implementing:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/**/*.spec.ts'
```

If `--include` is not supported by the current Angular/Karma setup, run:

```bash
npm run test -w @ladon/ui -- --watch=false
```

Before considering implementation complete:

```bash
npm run build -w @ladon/ui
npm run test -w @ladon/ui -- --watch=false
```

## Task 1: Shared Static Types

**Files:**
- Create: `ui/src/app/staticweb/staticweb.types.ts`
- Test: types are compiled by later service tests

- [ ] **Step 1: Create the type file**

Add:

```ts
import { SafeHtml } from '@angular/platform-browser';

export type StaticRenderMode = 'display-only' | 'trusted';
export type StaticPolicyResultKind = 'allow' | 'deny' | 'missing' | 'legacy' | 'invalid';
export type StaticScriptKind = 'inline-classic' | 'inline-module' | 'external';

export interface StaticDefinition {
  id?: string;
  source: string;
  mode: StaticRenderMode;
  allowScripts: boolean;
  allowedScriptSources: 'same-origin';
}

export interface StaticResolveInput {
  htmlId?: string | null;
  page?: string | null;
}

export interface StaticPolicyResult {
  kind: StaticPolicyResultKind;
  definition?: StaticDefinition;
  error?: string;
}

export interface StaticPolicyProvider {
  resolve(input: StaticResolveInput): StaticPolicyResult;
}

export interface StaticScriptDescriptor {
  kind: StaticScriptKind;
  content?: string;
  src?: string;
  attributes: Record<string, string>;
}

export interface StaticRenderPlan {
  mode: StaticRenderMode;
  html: string;
  safeHtml?: SafeHtml;
  scripts: StaticScriptDescriptor[];
}

export interface LadonStaticFacade {
  api: unknown;
  fetchClient: unknown;
  utility: unknown;
  auth: unknown;
  cssHref?: string;
  init(options?: Record<string, unknown>): Promise<LadonStaticFacade>;
}
```

- [ ] **Step 2: Run TypeScript compilation indirectly**

Run:

```bash
npm run build -w @ladon/ui
```

Expected: this may fail later because services are not implemented yet if imports were added prematurely. At this task, no imports should exist, so build should not fail because of this file.

- [ ] **Step 3: Commit**

```bash
git add ui/src/app/staticweb/staticweb.types.ts
git commit -m "feat(static): add static renderer types"
```

## Task 2: Legacy URL Policy

**Files:**
- Create: `ui/src/app/staticweb/static-url-policy.service.ts`
- Create: `ui/src/app/staticweb/static-url-policy.service.spec.ts`

- [ ] **Step 1: Write failing tests**

Test cases:

```ts
it('resolves bare legacy names under /public/html/', () => {
  expect(service.normalizeLegacySource('test.html')).toBe('/public/html/test.html');
});

it('resolves existing navigation paths under /public/html/', () => {
  expect(service.normalizeLegacySource('./public/html/test.html')).toBe('/public/html/test.html');
});

it('accepts approved absolute ui public html paths', () => {
  expect(service.normalizeLegacySource('/public/html/test.html')).toBe('/public/html/test.html');
});

it('accepts approved static public paths', () => {
  expect(service.normalizeLegacySource('/static/public/demo/module.html')).toBe('/static/public/demo/module.html');
});

it('rejects external urls', () => {
  expect(() => service.normalizeLegacySource('https://example.test/x.html')).toThrowError(/not allowed/i);
});

it('rejects javascript urls', () => {
  expect(() => service.normalizeLegacySource('javascript:alert(1)')).toThrowError(/not allowed/i);
});

it('rejects traversal outside approved roots', () => {
  expect(() => service.normalizeLegacySource('/public/html/../../index.html')).toThrowError(/not allowed/i);
});

it('rejects encoded traversal outside approved roots', () => {
  expect(() => service.normalizeLegacySource('/public/html/%2e%2e/%2e%2e/index.html')).toThrowError(/not allowed/i);
});

it('rejects double-encoded dot traversal outside approved roots', () => {
  expect(() => service.normalizeLegacySource('/public/html/%252e%252e/%252e%252e/index.html')).toThrowError(/not allowed/i);
});

it('rejects encoded slashes that could change the normalized path', () => {
  expect(() => service.normalizeLegacySource('/public/html/%2f..%2findex.html')).toThrowError(/not allowed/i);
});

it('rejects double-encoded slashes that could be decoded downstream', () => {
  expect(() => service.normalizeLegacySource('/public/html/%252f..%252findex.html')).toThrowError(/not allowed/i);
});

it('rejects double-encoded backslashes that could be decoded downstream', () => {
  expect(() => service.normalizeLegacySource('/public/html/%255c..%255cindex.html')).toThrowError(/not allowed/i);
});

it('rejects malformed percent encoding', () => {
  expect(() => service.normalizeLegacySource('/public/html/%E0%A4%A.html')).toThrowError(/not allowed/i);
});

it('strips query and hash before validation', () => {
  expect(service.normalizeLegacySource('/public/html/test.html?x=1#top')).toBe('/public/html/test.html');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/static-url-policy.service.spec.ts'
```

Expected: FAIL because `StaticUrlPolicyService` does not exist.

- [ ] **Step 3: Implement service**

Implementation outline:

```ts
import { Injectable } from '@angular/core';

const APPROVED_ROOTS = ['/public/html/', '/static/public/'];
const DEFAULT_RELATIVE_ROOT = '/public/html/';

@Injectable({ providedIn: 'root' })
export class StaticUrlPolicyService {
  normalizeLegacySource(source: string): string {
    const trimmed = source.trim();
    if (!trimmed) throw new Error('Static source is required');
    if (this.hasBlockedProtocol(trimmed)) throw new Error('Static source is not allowed');

    const pathOnly = trimmed.split(/[?#]/, 1)[0];
    if (this.containsEncodedSeparator(pathOnly)) throw new Error('Static source is not allowed');
    const decodedPath = this.decodePath(pathOnly);
    if (/[\\]/.test(decodedPath)) throw new Error('Static source is not allowed');
    if (this.containsEncodedSeparator(decodedPath)) throw new Error('Static source is not allowed');
    if (this.containsRemainingPercentEncoding(decodedPath)) throw new Error('Static source is not allowed');
    const absolutePath = this.toAbsoluteLegacyPath(decodedPath);
    const normalized = this.normalizePath(absolutePath);

    if (!APPROVED_ROOTS.some((root) => normalized.startsWith(root))) {
      throw new Error('Static source is not allowed');
    }

    return normalized;
  }

  private hasBlockedProtocol(value: string): boolean {
    return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value);
  }

  private containsEncodedSeparator(value: string): boolean {
    return /%2f|%5c/i.test(value);
  }

  private containsRemainingPercentEncoding(value: string): boolean {
    return /%[0-9a-f]{2}/i.test(value);
  }

  private decodePath(path: string): string {
    try {
      return decodeURIComponent(path);
    } catch {
      throw new Error('Static source is not allowed');
    }
  }

  private toAbsoluteLegacyPath(path: string): string {
    if (path.startsWith('/')) return path;
    if (path.startsWith('./public/html/')) return path.slice(1);
    if (path.startsWith('public/html/')) return `/${path}`;
    if (path.startsWith('./static/public/')) return path.slice(1);
    if (path.startsWith('static/public/')) return `/${path}`;
    return `${DEFAULT_RELATIVE_ROOT}${path}`;
  }

  private normalizePath(path: string): string {
    const parts: string[] = [];
    for (const part of path.split('/')) {
      if (!part || part === '.') continue;
      if (part === '..') parts.pop();
      else parts.push(part);
    }
    return `/${parts.join('/')}`;
  }
}
```

Important: after implementing, re-check traversal tests. The simple `parts.pop()` approach must not let `/public/html/../../index.html`, encoded dot segments, encoded slashes, double-encoded separators, or double-encoded dot segments pass. Reject malformed percent-encoding and any remaining percent-encoded byte sequence after the first decode rather than trying to recover.

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/static-url-policy.service.spec.ts'
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ui/src/app/staticweb/static-url-policy.service.ts ui/src/app/staticweb/static-url-policy.service.spec.ts
git commit -m "feat(static): validate legacy static sources"
```

## Task 3: Policy Provider And Static Definition Resolver

**Files:**
- Create: `ui/src/app/staticweb/static-policy-provider.service.ts`
- Create: `ui/src/app/staticweb/static-policy-provider.service.spec.ts`
- Create: `ui/src/app/staticweb/static-definition.resolver.ts`
- Create: `ui/src/app/staticweb/static-definition.resolver.spec.ts`
- Modify only if needed later: `ui/public/navigation.json`

- [ ] **Step 1: Write failing policy-provider tests**

Cover:

```ts
it('returns missing until an API-backed policy endpoint exists', () => {
  expect(provider.resolve({ htmlId: 'my-static' }).kind).toBe('missing');
});

it('returns missing for legacy page input and lets the resolver apply local fallback rules', () => {
  expect(provider.resolve({ page: './public/html/test.html' }).kind).toBe('missing');
});
```

- [ ] **Step 2: Run policy-provider test to verify it fails**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/static-policy-provider.service.spec.ts'
```

Expected: FAIL because provider does not exist.

- [ ] **Step 3: Implement policy provider**

Initial implementation:

```ts
import { Injectable } from '@angular/core';
import { StaticPolicyProvider, StaticPolicyResult, StaticResolveInput } from './staticweb.types';

@Injectable({ providedIn: 'root' })
export class StaticPolicyProviderService implements StaticPolicyProvider {
  resolve(_input: StaticResolveInput): StaticPolicyResult {
    return { kind: 'missing', error: 'Static API policy endpoint is not implemented yet' };
  }
}
```

This is intentionally small. Its purpose is to make API/server precedence explicit and testable before the backend endpoint exists. When the endpoint exists, only this provider should learn how to call it.

- [ ] **Step 4: Run policy-provider tests**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/static-policy-provider.service.spec.ts'
```

Expected: PASS.

- [ ] **Step 5: Write failing resolver tests**

Cover:

```ts
it('uses an API allow result before local fallback', () => {
  policyProvider.resolve.and.returnValue({
    kind: 'allow',
    definition: {
      source: '/server/static/page.html',
      mode: 'display-only',
      allowScripts: false,
      allowedScriptSources: 'same-origin',
    },
  });

  const result = resolver.resolve({ page: './public/html/test.html' });

  expect(result.kind).toBe('allow');
  expect(result.definition?.source).toBe('/server/static/page.html');
  expect(result.definition?.mode).toBe('display-only');
});

it('does not allow local trusted fallback to override API denial', () => {
  policyProvider.resolve.and.returnValue({ kind: 'deny', error: 'Denied by server policy' });

  const result = resolver.resolve({ page: './public/html/test.html' });

  expect(result.kind).toBe('deny');
  expect(result.definition).toBeUndefined();
});

it('returns local trusted fallback for the bundled Static Example', () => {
  policyProvider.resolve.and.returnValue({ kind: 'missing' });
  const result = resolver.resolve({ page: './public/html/test.html' });
  expect(result.kind).toBe('allow');
  expect(result.definition?.source).toBe('/public/html/test.html');
  expect(result.definition?.mode).toBe('trusted');
  expect(result.definition?.allowScripts).toBeTrue();
});

it('defaults valid legacy sources without fallback to display-only', () => {
  policyProvider.resolve.and.returnValue({ kind: 'missing' });
  const result = resolver.resolve({ page: '/public/html/unknown.html' });
  expect(result.kind).toBe('legacy');
  expect(result.definition?.mode).toBe('display-only');
  expect(result.definition?.allowScripts).toBeFalse();
});

it('blocks invalid legacy source', () => {
  policyProvider.resolve.and.returnValue({ kind: 'missing' });
  const result = resolver.resolve({ page: 'https://example.test/x.html' });
  expect(result.kind).toBe('invalid');
  expect(result.definition).toBeUndefined();
});

it('resolves route htmlId as missing until API-backed definitions exist', () => {
  policyProvider.resolve.and.returnValue({ kind: 'missing' });
  const result = resolver.resolve({ htmlId: 'my-static' });
  expect(result.kind).toBe('missing');
});
```

- [ ] **Step 6: Run resolver test to verify it fails**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/static-definition.resolver.spec.ts'
```

Expected: FAIL because resolver does not exist.

- [ ] **Step 7: Implement resolver**

Initial implementation:

```ts
import { Injectable } from '@angular/core';
import { StaticPolicyProviderService } from './static-policy-provider.service';
import { StaticUrlPolicyService } from './static-url-policy.service';
import { StaticPolicyResult, StaticResolveInput } from './staticweb.types';

@Injectable({ providedIn: 'root' })
export class StaticDefinitionResolver {
  private readonly localTrustedSources = new Set(['/public/html/test.html']);

  constructor(
    private readonly policyProvider: StaticPolicyProviderService,
    private readonly urlPolicy: StaticUrlPolicyService,
  ) {}

  resolve(input: StaticResolveInput): StaticPolicyResult {
    const policyResult = this.policyProvider.resolve(input);
    if (policyResult.kind === 'allow' || policyResult.kind === 'deny' || policyResult.kind === 'invalid') {
      return policyResult;
    }

    if (input.htmlId) {
      return policyResult;
    }

    if (!input.page) {
      return { kind: 'invalid', error: 'No static page requested' };
    }

    try {
      const source = this.urlPolicy.normalizeLegacySource(input.page);
      if (this.localTrustedSources.has(source)) {
        return {
          kind: 'allow',
          definition: {
            source,
            mode: 'trusted',
            allowScripts: true,
            allowedScriptSources: 'same-origin',
          },
        };
      }

      return {
        kind: 'legacy',
        definition: {
          source,
          mode: 'display-only',
          allowScripts: false,
          allowedScriptSources: 'same-origin',
        },
      };
    } catch (error) {
      return { kind: 'invalid', error: error instanceof Error ? error.message : 'Invalid static source' };
    }
  }
}
```

Do not bypass `StaticPolicyProviderService` for local trusted fallbacks. The resolver must always ask the policy provider first and may use local fallback only when the provider returns `missing`.

- [ ] **Step 8: Run resolver tests**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/static-definition.resolver.spec.ts'
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add ui/src/app/staticweb/static-policy-provider.service.ts ui/src/app/staticweb/static-policy-provider.service.spec.ts ui/src/app/staticweb/static-definition.resolver.ts ui/src/app/staticweb/static-definition.resolver.spec.ts
git commit -m "feat(static): resolve static definitions"
```

## Task 4: Display-Only HTML Sanitizer

**Files:**
- Create: `ui/src/app/staticweb/static-html-sanitizer.service.ts`
- Create: `ui/src/app/staticweb/static-html-sanitizer.service.spec.ts`

- [ ] **Step 1: Write failing sanitizer tests**

Cover:

```ts
it('removes script elements', () => {
  expect(service.sanitize('<p>ok</p><script>window.x=1</script>')).toBe('<p>ok</p>');
});

it('removes inline event handlers', () => {
  expect(service.sanitize('<button onclick="alert(1)">Run</button>')).not.toContain('onclick');
});

it('removes javascript href values', () => {
  expect(service.sanitize('<a href="javascript:alert(1)">bad</a>')).not.toContain('javascript:');
});

it('removes protocol-relative external urls', () => {
  expect(service.sanitize('<a href="//example.test/x">bad</a>')).not.toContain('//example.test/x');
});

it('removes risky embedding elements', () => {
  const output = service.sanitize('<iframe src="/x"></iframe><object></object><embed>');
  expect(output).not.toContain('iframe');
  expect(output).not.toContain('object');
  expect(output).not.toContain('embed');
});

it('keeps ordinary markup and classes', () => {
  expect(service.sanitize('<section class="p-4"><h1>Hello</h1></section>')).toContain('class="p-4"');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/static-html-sanitizer.service.spec.ts'
```

Expected: FAIL because sanitizer does not exist.

- [ ] **Step 3: Implement conservative sanitizer**

Use browser DOM parsing. Avoid regex-only sanitizing.

Implementation outline:

```ts
import { Injectable } from '@angular/core';

const BLOCKED_ELEMENTS = new Set(['SCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'BASE']);
const URL_ATTRIBUTES = new Set(['href', 'src', 'xlink:href', 'formaction']);
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

@Injectable({ providedIn: 'root' })
export class StaticHtmlSanitizer {
  sanitize(html: string): string {
    const template = document.createElement('template');
    template.innerHTML = html;
    this.walk(template.content);
    return template.innerHTML;
  }

  private walk(root: ParentNode): void {
    for (const node of Array.from(root.childNodes)) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const element = node as Element;
      if (BLOCKED_ELEMENTS.has(element.tagName)) {
        element.remove();
        continue;
      }
      this.cleanAttributes(element);
      this.walk(element);
    }
  }

  private cleanAttributes(element: Element): void {
    for (const attr of Array.from(element.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on')) {
        element.removeAttribute(attr.name);
        continue;
      }
      if (URL_ATTRIBUTES.has(name) && !this.isSafeUrl(attr.value)) {
        element.removeAttribute(attr.name);
      }
    }
  }

  private isSafeUrl(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('/')) return true;
    try {
      const url = new URL(trimmed, window.location.origin);
      return ALLOWED_PROTOCOLS.includes(url.protocol) && url.origin === window.location.origin;
    } catch {
      return false;
    }
  }
}
```

Adjust as needed so tests pass. Be careful: allowing absolute `https:` from any origin may be okay for links but not for executable resources. Keep first implementation conservative.

- [ ] **Step 4: Run sanitizer tests**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/static-html-sanitizer.service.spec.ts'
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ui/src/app/staticweb/static-html-sanitizer.service.ts ui/src/app/staticweb/static-html-sanitizer.service.spec.ts
git commit -m "feat(static): sanitize display-only html"
```

## Task 5: HTML Policy Parser And Validator

**Files:**
- Create: `ui/src/app/staticweb/static-html-policy.service.ts`
- Create: `ui/src/app/staticweb/static-html-policy.service.spec.ts`
- Modify: `ui/src/app/staticweb/staticweb.types.ts` if extra error/result types are needed

- [ ] **Step 1: Write failing policy tests**

Cover:

```ts
it('creates display-only plan with sanitized html and no scripts', () => {
  const plan = service.createRenderPlan('<p onclick="x()">ok</p><script>bad()</script>', displayOnlyDefinition);
  expect(plan.mode).toBe('display-only');
  expect(plan.html).toContain('<p');
  expect(plan.html).not.toContain('onclick');
  expect(plan.scripts.length).toBe(0);
});

it('extracts inline classic scripts in trusted mode', () => {
  const plan = service.createRenderPlan('<div></div><script>window.a=1</script>', trustedDefinition);
  expect(plan.scripts[0].kind).toBe('inline-classic');
  expect(plan.scripts[0].content).toContain('window.a=1');
});

it('extracts inline module scripts in trusted mode', () => {
  const plan = service.createRenderPlan('<script type="module">await Promise.resolve()</script>', trustedDefinition);
  expect(plan.scripts[0].kind).toBe('inline-module');
});

it('allows same-origin external scripts in trusted mode', () => {
  const plan = service.createRenderPlan('<script src="/public/html/helper.js"></script>', trustedDefinition);
  expect(plan.scripts[0].kind).toBe('external');
  expect(plan.scripts[0].src).toContain('/public/html/helper.js');
});

it('blocks external scripts from another origin in trusted mode', () => {
  expect(() => service.createRenderPlan('<script src="https://cdn.example/x.js"></script>', trustedDefinition))
    .toThrowError(/script source/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/static-html-policy.service.spec.ts'
```

Expected: FAIL because policy service does not exist.

- [ ] **Step 3: Implement policy service**

Implementation requirements:

- Use `<template>` for inert parsing.
- In `display-only`, call `StaticHtmlSanitizer.sanitize(html)` and return no scripts.
- In `trusted`, collect scripts in document order, validate each one, remove scripts from markup, and return markup plus script descriptors.
- Preserve script attributes except `src` is represented as normalized `src`.
- Treat empty/malformed external `src` as policy error.
- Allow external scripts only when `new URL(src, window.location.origin).origin === window.location.origin`.

- [ ] **Step 4: Run policy tests**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/static-html-policy.service.spec.ts'
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ui/src/app/staticweb/static-html-policy.service.ts ui/src/app/staticweb/static-html-policy.service.spec.ts ui/src/app/staticweb/staticweb.types.ts
git commit -m "feat(static): build static html render plans"
```

## Task 6: Trusted Runtime Facade

**Files:**
- Create: `ui/src/app/staticweb/static-runtime-facade.service.ts`
- Create: `ui/src/app/staticweb/static-runtime-facade.service.spec.ts`

- [ ] **Step 1: Write failing facade tests**

Cover:

```ts
it('sets window.ladonStatic and window.ladonStaticReady', async () => {
  const facade = service.install();
  expect((window as any).ladonStatic).toBe(facade);
  await expectAsync((window as any).ladonStaticReady).toBeResolvedTo(facade);
});

it('clears installed globals', () => {
  service.install();
  service.clear();
  expect((window as any).ladonStatic).toBeUndefined();
  expect((window as any).ladonStaticReady).toBeUndefined();
});

it('init resolves to the same facade', async () => {
  const facade = service.install();
  await expectAsync(facade.init()).toBeResolvedTo(facade);
});

it('exposes concrete @ladon/api fetchClient and auth exports', () => {
  const facade = service.install();
  expect(facade.fetchClient).toBe(fetchClient);
  expect(facade.auth).toBe(auth);
});

it('exposes concrete @ladon/utility utility exports', () => {
  const facade = service.install();
  expect(facade.utility).toBe(utility);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/static-runtime-facade.service.spec.ts'
```

Expected: FAIL because facade service does not exist.

- [ ] **Step 3: Implement facade service**

Implementation outline:

- Inject `FetchApiFactory`.
- Import concrete exports:
  - `import { auth, fetchClient } from '@ladon/api';`
  - `import { utility } from '@ladon/utility';`
- Build facade:
  - `api`: `{ fetchClient, utility, auth, apiFactory }`.
  - `fetchClient`: the concrete generated fetch client namespace from `@ladon/api`.
  - `utility`: the concrete utility export from `@ladon/utility`.
  - `auth`: the concrete auth export from `@ladon/api`.
  - `cssHref`: the shared style href if the app can determine it; otherwise leave `undefined`.
  - `init`: async function resolving to the same facade.
- Set globals only for trusted rendering.
- Clear globals on display-only render, error, route change, and destroy.

Do not use empty `utility` or `auth` objects. Trusted static pages are allowed to rely on the minimum facade contract from the spec.

- [ ] **Step 4: Run facade tests**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/static-runtime-facade.service.spec.ts'
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ui/src/app/staticweb/static-runtime-facade.service.ts ui/src/app/staticweb/static-runtime-facade.service.spec.ts
git commit -m "feat(static): expose trusted static runtime"
```

## Task 7: Trusted Script Runner

**Files:**
- Create: `ui/src/app/staticweb/static-script-runner.service.ts`
- Create: `ui/src/app/staticweb/static-script-runner.service.spec.ts`

- [ ] **Step 1: Write failing runner tests**

Cover:

```ts
it('executes inline classic scripts', async () => {
  await service.run([{ kind: 'inline-classic', content: 'window.__staticTest = 1', attributes: {} }]);
  expect((window as any).__staticTest).toBe(1);
});

it('creates module scripts with type module', async () => {
  await service.run([{ kind: 'inline-module', content: 'window.__staticModule = 1', attributes: { type: 'module' } }]);
  const script = document.head.querySelector('script[data-ladon-static-script="true"][type="module"]');
  expect(script).toBeTruthy();
});

it('creates external scripts with src', async () => {
  const runPromise = service.run([{ kind: 'external', src: '/public/html/helper.js', attributes: { src: '/public/html/helper.js' } }]);
  const script = document.head.querySelector('script[data-ladon-static-script="true"][src="/public/html/helper.js"]');
  expect(script).toBeTruthy();
  script?.dispatchEvent(new Event('load'));
  await runPromise;
});

it('waits for an external script before running the next inline script', async () => {
  const runPromise = service.run([
    { kind: 'external', src: '/public/html/helper.js', attributes: { src: '/public/html/helper.js' } },
    { kind: 'inline-classic', content: 'window.__staticSequence = "inline"', attributes: {} },
  ]);

  expect((window as any).__staticSequence).toBeUndefined();
  document.head
    .querySelector('script[data-ladon-static-script="true"][src="/public/html/helper.js"]')
    ?.dispatchEvent(new Event('load'));
  await runPromise;
  expect((window as any).__staticSequence).toBe('inline');
});

it('rejects when an external script fails to load', async () => {
  const runPromise = service.run([{ kind: 'external', src: '/public/html/missing.js', attributes: { src: '/public/html/missing.js' } }]);
  document.head
    .querySelector('script[data-ladon-static-script="true"][src="/public/html/missing.js"]')
    ?.dispatchEvent(new Event('error'));
  await expectAsync(runPromise).toBeRejected();
});

it('removes injected scripts on cleanup', async () => {
  await service.run([{ kind: 'inline-classic', content: 'window.__staticCleanup = 1', attributes: {} }]);
  service.cleanup();
  expect(document.head.querySelector('script[data-ladon-static-script="true"]')).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/static-script-runner.service.spec.ts'
```

Expected: FAIL because script runner does not exist.

- [ ] **Step 3: Implement runner**

Implementation requirements:

- Always call `cleanup()` before running a new plan.
- `run(scripts)` must return `Promise<void>`.
- Execute scripts sequentially in descriptor order.
- Create fresh script elements.
- Copy safe attributes.
- Mark every injected script with `data-ladon-static-script="true"` so tests and cleanup only target scripts owned by this service.
- For external scripts, set `src`, append the element, and await its `load` event before continuing to the next descriptor.
- Reject the `run()` promise on external script `error`.
- For inline module scripts, set `type="module"`.
- For inline classic scripts, set `text`.
- Track injected elements and remove them in `cleanup()`.
- Do not re-validate policy here; policy belongs to `StaticHtmlPolicyService`.

- [ ] **Step 4: Run runner tests**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/static-script-runner.service.spec.ts'
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ui/src/app/staticweb/static-script-runner.service.ts ui/src/app/staticweb/static-script-runner.service.spec.ts
git commit -m "feat(static): execute trusted static scripts"
```

## Task 8: Staticweb Component Integration

**Files:**
- Modify: `ui/src/app/staticweb/staticweb.component.ts`
- Modify: `ui/src/app/staticweb/staticweb.component.html`
- Modify: `ui/src/app/staticweb/staticweb.component.spec.ts`

- [ ] **Step 1: Write failing component tests**

Cover:

```ts
it('renders display-only html for legacy sources without trusted fallback', fakeAsync(() => {
  // Arrange ActivatedRoute queryParams with page=/public/html/unknown.html
  // Mock HttpClient.get to return '<p onclick="x()">Hello</p><script>bad()</script>'
  // Assert rendered SafeHtml contains Hello and script runner was not called.
}));

it('installs trusted runtime and runs scripts for trusted local fallback', fakeAsync(() => {
  // Arrange page=./public/html/test.html
  // Mock HttpClient.get to return '<p>Hello</p><script>window.__trustedStatic=1</script>'
  // Assert runtimeFacade.install and scriptRunner.run were called.
}));

it('shows policy error when resolver blocks source', fakeAsync(() => {
  // Arrange page=https://example.test/x.html
  // Assert error state is visible and HttpClient.get is not called.
}));

it('cleans up scripts and runtime on destroy', () => {
  component.ngOnDestroy();
  expect(scriptRunner.cleanup).toHaveBeenCalled();
  expect(runtimeFacade.clear).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run component test to verify it fails**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/staticweb.component.spec.ts'
```

Expected: FAIL until component is refactored.

- [ ] **Step 3: Refactor component**

Implementation outline:

- Replace `staticHMTL` with clear state:
  - `staticHTML?: SafeHtml`
  - `loading = false`
  - `error?: string`
- Subscribe to both `queryParams` and `paramMap` or use `combineLatest`.
- Resolve `{ htmlId, page }` via `StaticDefinitionResolver`.
- For `invalid`, `missing`, or `deny` without a renderable definition:
  - clear runtime and scripts.
  - show error.
  - do not call `HttpClient.get`.
- For valid definitions:
  - load `definition.source` as text.
  - create render plan via `StaticHtmlPolicyService`.
  - for `display-only`: clear runtime, cleanup scripts, set sanitized SafeHtml.
  - for `trusted`: install runtime, set trusted SafeHtml, then `await` or observable-chain `scriptRunner.run(plan.scripts)` so external script failures become component errors.
- Keep existing `ladon:error:page:*` dispatch behavior for HTTP errors.
- Use `takeUntilDestroyed` if available in Angular 19, or keep a `Subscription` and unsubscribe in `ngOnDestroy`.

- [ ] **Step 4: Refactor template**

Template shape:

```html
@if (loading) {
  <div id="static-page-loading">Loading...</div>
} @else if (error) {
  <div id="static-page-error">{{ error }}</div>
} @else if (staticHTML) {
  <div id="static-page-content" [innerHTML]="staticHTML"></div>
}
```

- [ ] **Step 5: Run component tests**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/staticweb.component.spec.ts'
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add ui/src/app/staticweb/staticweb.component.ts ui/src/app/staticweb/staticweb.component.html ui/src/app/staticweb/staticweb.component.spec.ts
git commit -m "feat(static): render statics through policy services"
```

## Task 9: Routes And Navigation Compatibility

**Files:**
- Modify: `ui/src/app/app.routes.ts`
- Modify only if needed: `ui/public/navigation.json`
- Test: existing route tests if any, otherwise component resolver tests cover behavior

- [ ] **Step 1: Inspect current static routes**

Confirm current routes:

```ts
{ path: `${environment.baseHref}/static`, component: StaticwebComponent, canActivate: [AuthGuard] }
{ path: `${environment.baseHref}/static/:htmlId`, component: StaticwebComponent }
```

- [ ] **Step 2: Decide whether to add `AuthGuard` to `static/:htmlId`**

The spec assumes productive Statics run in the authenticated UI. Unless there is a known public-static requirement, add `canActivate: [AuthGuard]` to `static/:htmlId` too.

- [ ] **Step 3: Check navigation static entry**

Current example:

```json
{
  "label": "Static Example",
  "target": "static",
  "component": "Staticweb",
  "path": "./public/html/test.html"
}
```

Keep it unchanged if navigation click behavior already generates `/static?page=...`. The resolver local fallback should trust this exact source after normalization.

- [ ] **Step 4: Run focused static tests**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/**/*.spec.ts'
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ui/src/app/app.routes.ts ui/public/navigation.json
git commit -m "feat(static): align static routes with policy renderer"
```

If `ui/public/navigation.json` was not changed, omit it from `git add`.

## Task 10: Browser Integration Coverage And Full Verification

**Files:**
- Create: `ui/src/app/staticweb/staticweb.integration.spec.ts`
- Modify only files that need final small fixes from verification.

- [ ] **Step 1: Write failing browser/integration tests**

Create tests that exercise the actual Angular component and DOM in Karma, not only isolated services:

```ts
it('executes an allowed trusted inline script through the component', fakeAsync(() => {
  // Arrange query param page=./public/html/test.html.
  // Mock HttpClient.get to return '<p id="ok">OK</p><script>window.__staticIntegrationAllowed = true</script>'.
  // Create StaticwebComponent, flush async work, and assert:
  // - '#static-page-content' exists
  // - window.__staticIntegrationAllowed === true
}));

it('blocks the whole trusted static when it contains an external cdn script', fakeAsync(() => {
  // Arrange query param page=./public/html/test.html.
  // Mock HttpClient.get to return '<p id="should-not-render">Blocked</p><script src="https://cdn.example/x.js"></script>'.
  // Create StaticwebComponent, flush async work, and assert:
  // - '#static-page-error' exists
  // - '#should-not-render' does not exist
  // - no external script element for cdn.example exists in document.head
}));
```

These tests satisfy the spec requirement for at least one browser/integration verification of allowed script execution and blocked external script behavior. Do not replace them with a manual-only smoke test.

- [ ] **Step 2: Run integration test to verify it fails**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/staticweb.integration.spec.ts'
```

Expected: FAIL until component/policy/script integration is complete.

- [ ] **Step 3: Implement any missing integration hooks**

If the integration tests fail after Tasks 1-9, fix only the relevant static renderer files. Common fixes:

- Ensure trusted policy violations clear `staticHTML` and set `error`.
- Ensure `StaticHtmlPolicyService` validates all scripts before any trusted render executes.
- Ensure `StaticwebComponent` calls `scriptRunner.cleanup()` and `runtimeFacade.clear()` before setting error state.
- Ensure `StaticScriptRunner.run()` is awaited/chained by the component.

- [ ] **Step 4: Run integration test**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/staticweb.integration.spec.ts'
```

Expected: PASS.

- [ ] **Step 5: Commit integration test and fixes**

```bash
git add ui/src/app/staticweb/staticweb.integration.spec.ts ui/src/app/staticweb
git commit -m "test(static): cover static script execution policy"
```

If no implementation files changed in this task, the `git add ui/src/app/staticweb` command is still acceptable because it should only stage intended staticweb changes. Check `git status --short` first if the worktree contains unrelated staticweb edits.

- [ ] **Step 6: Run all static tests**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false --include='src/app/staticweb/**/*.spec.ts'
```

Expected: PASS.

- [ ] **Step 7: Run all UI tests**

Run:

```bash
npm run test -w @ladon/ui -- --watch=false
```

Expected: PASS. If failures are unrelated existing failures, capture exact failures and verify static tests still pass.

- [ ] **Step 8: Run UI build**

Run:

```bash
npm run build -w @ladon/ui
```

Expected: PASS.

- [ ] **Step 9: Manual browser smoke test**

Start dev server:

```bash
npm run serve:ui
```

Open a Static Example route generated by the UI navigation. Verify:

- The bundled `ui/public/html/test.html` renders.
- Trusted local fallback scripts execute if the page contains scripts.
- The browser/integration test already covers blocked external script behavior; manually re-check only if a temporary local test page was useful during debugging.
- A non-trusted legacy page renders sanitized HTML without script execution.

Stop the dev server after the smoke test.

- [ ] **Step 10: Check git status**

Run:

```bash
git status --short
```

Expected: only intended static renderer files are modified/staged; unrelated pre-existing worktree changes remain untouched.

- [ ] **Step 11: Final commit**

If verification required cleanup changes:

```bash
git add ui/src/app/staticweb ui/src/app/app.routes.ts
git commit -m "test(static): verify static policy renderer"
```

Skip this commit if there are no final changes after previous task commits.

## Implementation Notes

- Use `DomSanitizer.bypassSecurityTrustHtml` only after the renderer has produced a trusted render plan or sanitized display-only output.
- Do not add a third-party sanitizer dependency in this first plan unless the implementer explicitly decides the dependency approval is worth it. The in-house sanitizer must remain conservative.
- Do not implement the future iframe sandbox in this plan.
- Do not implement a backend Static policy endpoint in this plan unless an existing endpoint is discovered. Keep the resolver extension point ready for that later task.
- Keep same-origin external script validation in `StaticHtmlPolicyService`; do not duplicate it in `StaticScriptRunner`.
- Existing unstaged worktree changes outside `ui/src/app/staticweb`, `ui/src/app/app.routes.ts`, and optional `ui/public/navigation.json` must not be reverted.

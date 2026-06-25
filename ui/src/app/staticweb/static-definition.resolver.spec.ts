import { TestBed } from '@angular/core/testing';

import { StaticDefinitionResolver } from './static-definition.resolver';
import { StaticPolicyProviderService } from './static-policy-provider.service';
import { STATIC_TRUSTED_EXECUTION_ENABLED } from './static-trust-boundary.service';

describe('StaticDefinitionResolver', () => {
  let resolver: StaticDefinitionResolver;
  let policyProvider: jasmine.SpyObj<StaticPolicyProviderService>;

  function configureResolver(trustedExecutionEnabled?: boolean): void {
    TestBed.resetTestingModule();
    policyProvider = jasmine.createSpyObj<StaticPolicyProviderService>('StaticPolicyProviderService', ['resolve']);

    TestBed.configureTestingModule({
      providers: [
        StaticDefinitionResolver,
        { provide: StaticPolicyProviderService, useValue: policyProvider },
        ...(trustedExecutionEnabled === undefined
          ? []
          : [{ provide: STATIC_TRUSTED_EXECUTION_ENABLED, useValue: trustedExecutionEnabled }]),
      ],
    });

    resolver = TestBed.inject(StaticDefinitionResolver);
  }

  beforeEach(() => {
    configureResolver();
  });

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

  it('returns provider invalid result before local fallback', () => {
    policyProvider.resolve.and.returnValue({ kind: 'invalid', error: 'Invalid by server policy' });

    const result = resolver.resolve({ page: './public/html/test.html' });

    expect(result.kind).toBe('invalid');
    expect(result.error).toBe('Invalid by server policy');
    expect(result.definition).toBeUndefined();
  });

  it('returns provider legacy result before local fallback', () => {
    policyProvider.resolve.and.returnValue({
      kind: 'legacy',
      definition: {
        source: '/server/static/page.html',
        mode: 'display-only',
        allowScripts: false,
        allowedScriptSources: 'same-origin',
      },
    });

    const result = resolver.resolve({ page: './public/html/test.html' });

    expect(result.kind).toBe('legacy');
    expect(result.definition?.source).toBe('/server/static/page.html');
    expect(result.definition?.mode).toBe('display-only');
  });

  it('downgrades trusted API allow results by default when the runtime trust boundary is disabled', () => {
    policyProvider.resolve.and.returnValue({
      kind: 'allow',
      definition: {
        source: '/server/static/trusted.html',
        mode: 'trusted',
        allowScripts: true,
        allowedScriptSources: 'same-origin',
      },
    });

    const result = resolver.resolve({ htmlId: 'trusted-api-static' });

    expect(result.kind).toBe('allow');
    expect(result.definition).toEqual({
      source: '/server/static/trusted.html',
      mode: 'display-only',
      allowScripts: false,
      allowedScriptSources: 'same-origin',
    });
  });

  it('preserves trusted API allow results when the runtime trust boundary is explicitly enabled', () => {
    configureResolver(true);
    policyProvider.resolve.and.returnValue({
      kind: 'allow',
      definition: {
        source: '/server/static/trusted.html',
        mode: 'trusted',
        allowScripts: true,
        allowedScriptSources: 'same-origin',
      },
    });

    const result = resolver.resolve({ htmlId: 'trusted-api-static' });

    expect(result.kind).toBe('allow');
    expect(result.definition).toEqual({
      source: '/server/static/trusted.html',
      mode: 'trusted',
      allowScripts: true,
      allowedScriptSources: 'same-origin',
    });
  });

  it('downgrades local trusted fallback for the bundled Static Example by default', () => {
    policyProvider.resolve.and.returnValue({ kind: 'missing' });
    const result = resolver.resolve({ page: './public/html/test.html' });
    expect(result.kind).toBe('allow');
    expect(result.definition?.source).toBe('/public/html/test.html');
    expect(result.definition?.mode).toBe('display-only');
    expect(result.definition?.allowScripts).toBeFalse();
  });

  it('downgrades local trusted fallback for the authenticated UI Static test page by default', () => {
    policyProvider.resolve.and.returnValue({ kind: 'missing' });
    const result = resolver.resolve({ page: './public/html/authenticated.html' });
    expect(result.kind).toBe('allow');
    expect(result.definition?.source).toBe('/public/html/authenticated.html');
    expect(result.definition?.mode).toBe('display-only');
    expect(result.definition?.allowScripts).toBeFalse();
  });

  it('preserves local trusted fallback when the runtime trust boundary is explicitly enabled', () => {
    configureResolver(true);
    policyProvider.resolve.and.returnValue({ kind: 'missing' });

    const result = resolver.resolve({ page: './public/html/authenticated.html' });

    expect(result.kind).toBe('allow');
    expect(result.definition?.source).toBe('/public/html/authenticated.html');
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
});

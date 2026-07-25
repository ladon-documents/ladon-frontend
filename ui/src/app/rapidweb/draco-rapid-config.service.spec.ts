import { TestBed } from '@angular/core/testing';

import { DracoRapidConfigService } from './draco-rapid-config.service';
import { RAPID_TRUSTED_EXECUTION_ENABLED } from './rapid-trust-boundary.service';

describe('DracoRapidConfigService', () => {
  let service: DracoRapidConfigService;

  function configureService(trustedExecutionEnabled = true): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        DracoRapidConfigService,
        { provide: RAPID_TRUSTED_EXECUTION_ENABLED, useValue: trustedExecutionEnabled },
      ],
    });

    service = TestBed.inject(DracoRapidConfigService);
  }

  function validConfig(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      rapidId: 'demo-rapid',
      html: 'index.html',
      mode: 'trusted',
      allowScripts: true,
      ...overrides,
    };
  }

  function validNavigation(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      label: 'Demo Rapid',
      target: 'rapid',
      path: 'demo-rapid',
      component: 'Rapidweb',
      type: 'main',
      index: 10,
      ...overrides,
    };
  }

  beforeEach(() => {
    configureService();
  });

  it('accepts a valid config whose rapid id matches the folder', () => {
    const entry = service.parseConfig('demo-rapid', validConfig());

    expect(entry).toEqual(
      jasmine.objectContaining({
        rapidId: 'demo-rapid',
        bucket: 'draco-rapids',
        basePath: 'demo-rapid/',
        html: 'index.html',
        htmlKey: 'demo-rapid/index.html',
        mode: 'trusted',
        allowScripts: true,
        allowedScriptSources: 'same-origin',
      }),
    );
    expect(entry.definition).toEqual({
      id: 'demo-rapid',
      source: 'demo-rapid/index.html',
      mode: 'trusted',
      allowScripts: true,
      allowedScriptSources: 'same-origin',
    });
  });

  it('defaults missing policy fields to display-only', () => {
    const entry = service.parseConfig('demo-rapid', {
      rapidId: 'demo-rapid',
      html: 'index.html',
    });

    expect(entry.mode).toBe('display-only');
    expect(entry.allowScripts).toBeFalse();
    expect(entry.definition.mode).toBe('display-only');
    expect(entry.definition.allowScripts).toBeFalse();
  });

  it('defaults invalid mode to display-only', () => {
    const entry = service.parseConfig('demo-rapid', validConfig({ mode: 'bogus', allowScripts: true }));

    expect(entry.mode).toBe('display-only');
    expect(entry.allowScripts).toBeFalse();
    expect(entry.definition.mode).toBe('display-only');
    expect(entry.definition.allowScripts).toBeFalse();
  });

  it('rejects invalid allowScripts values as malformed config', () => {
    expect(() => service.parseConfig('demo-rapid', validConfig({ allowScripts: 'true' }))).toThrowError(
      /allowScripts/i,
    );
  });

  it('rejects invalid allowedScriptSources values as malformed config', () => {
    expect(() => service.parseConfig('demo-rapid', validConfig({ allowedScriptSources: 'self-and-cdn' }))).toThrowError(
      /allowedScriptSources/i,
    );
  });

  it('rejects a rapid id that does not match the folder', () => {
    expect(() => service.parseConfig('demo-rapid', validConfig({ rapidId: 'other-rapid' }))).toThrowError(
      /rapidId.*folder/i,
    );
  });

  it('rejects unknown config fields', () => {
    for (const unknownField of ['id', 'source', 'label']) {
      expect(() => service.parseConfig('demo-rapid', validConfig({ [unknownField]: 'legacy-value' }))).toThrowError(
        /unknown.*config/i,
      );
    }
  });

  it('rejects rapid ids outside the strict grammar', () => {
    for (const rapidId of ['Demo', '-demo', 'demo_', 'demo.rapid', 'a'.repeat(64), '']) {
      expect(() => service.parseConfig(rapidId || 'blank', validConfig({ rapidId }))).toThrowError(/rapidId/i);
    }
  });

  it('rejects html paths with slashes or traversal', () => {
    for (const html of [
      'nested/index.html',
      '..\\index.html',
      '../index.html',
      'index%2Ehtml',
      'index.htm',
      '.index.html',
      'index.html?x=1',
      'index#x.html',
      'http:index.html',
    ]) {
      expect(() => service.parseConfig('demo-rapid', validConfig({ html }))).toThrowError(/html/i);
    }
  });

  it('normalizes trusted only when mode trusted and allowScripts true', () => {
    expect(service.parseConfig('demo-rapid', validConfig()).definition.mode).toBe('trusted');
    expect(service.parseConfig('demo-rapid', validConfig({ allowScripts: false })).definition.mode).toBe(
      'display-only',
    );
    expect(service.parseConfig('demo-rapid', validConfig({ mode: 'display-only' })).definition.mode).toBe(
      'display-only',
    );
  });

  it('accepts valid rapid navigation and generates id when missing', () => {
    const navigation = service.parseNavigation('demo-rapid', validNavigation());

    expect(navigation).toEqual({
      id: 'rapid:demo-rapid',
      label: 'Demo Rapid',
      target: 'rapid',
      path: 'demo-rapid',
      icon: undefined,
      type: 'main',
      index: 10,
    });
  });

  it('rejects navigation id that differs from rapid:<rapidId>', () => {
    expect(service.parseNavigation('demo-rapid', validNavigation({ id: 'custom-id' }))).toBeUndefined();
  });

  it('rejects navigation entries whose path differs from the rapid id', () => {
    expect(service.parseNavigation('demo-rapid', validNavigation({ path: 'other-rapid' }))).toBeUndefined();
  });

  it('rejects navigation entries with missing or blank labels', () => {
    expect(service.parseNavigation('demo-rapid', validNavigation({ label: undefined }))).toBeUndefined();
    expect(service.parseNavigation('demo-rapid', validNavigation({ label: '   ' }))).toBeUndefined();
  });

  it('rejects navigation entries with non-rapid targets', () => {
    expect(service.parseNavigation('demo-rapid', validNavigation({ target: 'internal' }))).toBeUndefined();
  });

  it('rejects navigation component values other than Rapidweb', () => {
    expect(service.parseNavigation('demo-rapid', validNavigation({ component: 'AdminComponent' }))).toBeUndefined();
  });

  it('rejects navigation entries with unsupported type values', () => {
    expect(service.parseNavigation('demo-rapid', validNavigation({ type: 'footer' }))).toBeUndefined();
  });

  it('rejects navigation entries with non-finite index values', () => {
    expect(service.parseNavigation('demo-rapid', validNavigation({ index: Number.POSITIVE_INFINITY }))).toBeUndefined();
  });

  it('rejects unknown navigation fields', () => {
    expect(service.parseNavigation('demo-rapid', validNavigation({ children: [] }))).toBeUndefined();
  });

  it('keeps a valid rapid renderable when navigation is invalid', () => {
    const entry = service.parseConfig('demo-rapid', validConfig());
    const navigation = service.parseNavigation('demo-rapid', validNavigation({ target: 'internal' }));

    expect(entry.definition.source).toBe('demo-rapid/index.html');
    expect(navigation).toBeUndefined();
  });

  it('downgrades trusted config to display-only when the trust boundary gate is disabled', () => {
    configureService(false);

    const entry = service.parseConfig('demo-rapid', validConfig());

    expect(entry.mode).toBe('display-only');
    expect(entry.allowScripts).toBeFalse();
    expect(entry.definition).toEqual({
      id: 'demo-rapid',
      source: 'demo-rapid/index.html',
      mode: 'display-only',
      allowScripts: false,
      allowedScriptSources: 'same-origin',
    });
  });
});

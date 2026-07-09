import { TestBed } from '@angular/core/testing';

import { DracoStaticConfigService } from './draco-static-config.service';
import { STATIC_TRUSTED_EXECUTION_ENABLED } from './static-trust-boundary.service';

describe('DracoStaticConfigService', () => {
  let service: DracoStaticConfigService;

  function configureService(trustedExecutionEnabled = true): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        DracoStaticConfigService,
        { provide: STATIC_TRUSTED_EXECUTION_ENABLED, useValue: trustedExecutionEnabled },
      ],
    });

    service = TestBed.inject(DracoStaticConfigService);
  }

  function validConfig(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      staticId: 'demo-static',
      html: 'index.html',
      mode: 'trusted',
      allowScripts: true,
      ...overrides,
    };
  }

  function validNavigation(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      label: 'Demo Static',
      target: 'static',
      path: 'demo-static',
      component: 'Staticweb',
      type: 'main',
      index: 10,
      ...overrides,
    };
  }

  beforeEach(() => {
    configureService();
  });

  it('accepts a valid config whose static id matches the folder', () => {
    const entry = service.parseConfig('demo-static', validConfig());

    expect(entry).toEqual(
      jasmine.objectContaining({
        staticId: 'demo-static',
        bucket: 'draco-statics',
        basePath: 'demo-static/',
        html: 'index.html',
        htmlKey: 'demo-static/index.html',
        mode: 'trusted',
        allowScripts: true,
        allowedScriptSources: 'same-origin',
      })
    );
    expect(entry.definition).toEqual({
      id: 'demo-static',
      source: 'demo-static/index.html',
      mode: 'trusted',
      allowScripts: true,
      allowedScriptSources: 'same-origin',
    });
  });

  it('defaults missing policy fields to display-only', () => {
    const entry = service.parseConfig('demo-static', {
      staticId: 'demo-static',
      html: 'index.html',
    });

    expect(entry.mode).toBe('display-only');
    expect(entry.allowScripts).toBeFalse();
    expect(entry.definition.mode).toBe('display-only');
    expect(entry.definition.allowScripts).toBeFalse();
  });

  it('defaults invalid mode to display-only', () => {
    const entry = service.parseConfig('demo-static', validConfig({ mode: 'bogus', allowScripts: true }));

    expect(entry.mode).toBe('display-only');
    expect(entry.allowScripts).toBeFalse();
    expect(entry.definition.mode).toBe('display-only');
    expect(entry.definition.allowScripts).toBeFalse();
  });

  it('rejects invalid allowScripts values as malformed config', () => {
    expect(() => service.parseConfig('demo-static', validConfig({ allowScripts: 'true' }))).toThrowError(
      /allowScripts/i
    );
  });

  it('rejects invalid allowedScriptSources values as malformed config', () => {
    expect(() =>
      service.parseConfig('demo-static', validConfig({ allowedScriptSources: 'self-and-cdn' }))
    ).toThrowError(/allowedScriptSources/i);
  });

  it('rejects a static id that does not match the folder', () => {
    expect(() => service.parseConfig('demo-static', validConfig({ staticId: 'other-static' }))).toThrowError(
      /staticId.*folder/i
    );
  });

  it('rejects unknown config fields', () => {
    for (const unknownField of ['id', 'source', 'label']) {
      expect(() => service.parseConfig('demo-static', validConfig({ [unknownField]: 'legacy-value' }))).toThrowError(
        /unknown.*config/i
      );
    }
  });

  it('rejects static ids outside the strict grammar', () => {
    for (const staticId of ['Demo', '-demo', 'demo_', 'demo.static', 'a'.repeat(64), '']) {
      expect(() => service.parseConfig(staticId || 'blank', validConfig({ staticId }))).toThrowError(/staticId/i);
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
      expect(() => service.parseConfig('demo-static', validConfig({ html }))).toThrowError(/html/i);
    }
  });

  it('normalizes trusted only when mode trusted and allowScripts true', () => {
    expect(service.parseConfig('demo-static', validConfig()).definition.mode).toBe('trusted');
    expect(service.parseConfig('demo-static', validConfig({ allowScripts: false })).definition.mode).toBe(
      'display-only'
    );
    expect(service.parseConfig('demo-static', validConfig({ mode: 'display-only' })).definition.mode).toBe(
      'display-only'
    );
  });

  it('accepts valid static navigation and generates id when missing', () => {
    const navigation = service.parseNavigation('demo-static', validNavigation());

    expect(navigation).toEqual({
      id: 'static:demo-static',
      label: 'Demo Static',
      target: 'static',
      path: 'demo-static',
      icon: undefined,
      type: 'main',
      index: 10,
    });
  });

  it('rejects navigation id that differs from static:<staticId>', () => {
    expect(service.parseNavigation('demo-static', validNavigation({ id: 'custom-id' }))).toBeUndefined();
  });

  it('rejects navigation entries whose path differs from the static id', () => {
    expect(service.parseNavigation('demo-static', validNavigation({ path: 'other-static' }))).toBeUndefined();
  });

  it('rejects navigation entries with missing or blank labels', () => {
    expect(service.parseNavigation('demo-static', validNavigation({ label: undefined }))).toBeUndefined();
    expect(service.parseNavigation('demo-static', validNavigation({ label: '   ' }))).toBeUndefined();
  });

  it('rejects navigation entries with non-static targets', () => {
    expect(service.parseNavigation('demo-static', validNavigation({ target: 'internal' }))).toBeUndefined();
  });

  it('rejects navigation component values other than Staticweb', () => {
    expect(service.parseNavigation('demo-static', validNavigation({ component: 'AdminComponent' }))).toBeUndefined();
  });

  it('rejects navigation entries with unsupported type values', () => {
    expect(service.parseNavigation('demo-static', validNavigation({ type: 'footer' }))).toBeUndefined();
  });

  it('rejects navigation entries with non-finite index values', () => {
    expect(service.parseNavigation('demo-static', validNavigation({ index: Number.POSITIVE_INFINITY }))).toBeUndefined();
  });

  it('rejects unknown navigation fields', () => {
    expect(service.parseNavigation('demo-static', validNavigation({ children: [] }))).toBeUndefined();
  });

  it('keeps a valid static renderable when navigation is invalid', () => {
    const entry = service.parseConfig('demo-static', validConfig());
    const navigation = service.parseNavigation('demo-static', validNavigation({ target: 'internal' }));

    expect(entry.definition.source).toBe('demo-static/index.html');
    expect(navigation).toBeUndefined();
  });

  it('downgrades trusted config to display-only when the trust boundary gate is disabled', () => {
    configureService(false);

    const entry = service.parseConfig('demo-static', validConfig());

    expect(entry.mode).toBe('display-only');
    expect(entry.allowScripts).toBeFalse();
    expect(entry.definition).toEqual({
      id: 'demo-static',
      source: 'demo-static/index.html',
      mode: 'display-only',
      allowScripts: false,
      allowedScriptSources: 'same-origin',
    });
  });
});

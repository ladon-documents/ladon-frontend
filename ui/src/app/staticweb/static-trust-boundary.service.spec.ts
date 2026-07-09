import { TestBed } from '@angular/core/testing';

import {
  STATIC_TRUSTED_EXECUTION_ENABLED,
  StaticTrustBoundaryService,
} from './static-trust-boundary.service';
import { StaticDefinition } from './staticweb.types';

describe('StaticTrustBoundaryService', () => {
  const trustedConfigDefinition: StaticDefinition = {
    source: 'draco-statics/demo/index.html',
    mode: 'trusted',
    allowScripts: true,
    allowedScriptSources: 'same-origin',
  };

  function configureService(trustedExecutionEnabled?: boolean): StaticTrustBoundaryService {
    TestBed.configureTestingModule({
      providers:
        trustedExecutionEnabled === undefined
          ? []
          : [{ provide: STATIC_TRUSTED_EXECUTION_ENABLED, useValue: trustedExecutionEnabled }],
    });

    return TestBed.inject(StaticTrustBoundaryService);
  }

  it('disables trusted static scripts by default when no backend trust guarantee is configured', () => {
    const service = configureService();

    expect(service.trustedStaticScriptsEnabled()).toBeFalse();
    expect(service.applyToDefinition(trustedConfigDefinition)).toEqual({
      ...trustedConfigDefinition,
      mode: 'display-only',
      allowScripts: false,
    });
  });

  it('allows trusted static scripts only when the runtime trust boundary is explicitly enabled', () => {
    const disabledService = configureService(false);

    expect(disabledService.trustedStaticScriptsEnabled()).toBeFalse();
    expect(disabledService.applyToDefinition(trustedConfigDefinition).mode).toBe('display-only');

    TestBed.resetTestingModule();
    const enabledService = configureService(true);

    expect(enabledService.trustedStaticScriptsEnabled()).toBeTrue();
    expect(enabledService.applyToDefinition(trustedConfigDefinition)).toEqual(trustedConfigDefinition);
  });

  it('documents that client checks are not the trust boundary', () => {
    const service = configureService();

    expect(service.trustBoundaryGuarantee()).toContain('backend/document permission model');
    expect(service.trustBoundaryGuarantee()).toContain('admin-only writes');
    expect(service.trustBoundaryGuarantee()).toContain('not the trust boundary');
  });
});

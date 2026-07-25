import { TestBed } from '@angular/core/testing';

import { RAPID_TRUSTED_EXECUTION_ENABLED, RapidTrustBoundaryService } from './rapid-trust-boundary.service';
import { RapidDefinition } from './rapidweb.types';

describe('RapidTrustBoundaryService', () => {
  const trustedConfigDefinition: RapidDefinition = {
    source: 'draco-rapids/demo/index.html',
    mode: 'trusted',
    allowScripts: true,
    allowedScriptSources: 'same-origin',
  };

  function configureService(trustedExecutionEnabled?: boolean): RapidTrustBoundaryService {
    TestBed.configureTestingModule({
      providers:
        trustedExecutionEnabled === undefined
          ? []
          : [{ provide: RAPID_TRUSTED_EXECUTION_ENABLED, useValue: trustedExecutionEnabled }],
    });

    return TestBed.inject(RapidTrustBoundaryService);
  }

  it('disables trusted rapid scripts by default when no backend trust guarantee is configured', () => {
    const service = configureService();

    expect(service.trustedRapidScriptsEnabled()).toBeFalse();
    expect(service.applyToDefinition(trustedConfigDefinition)).toEqual({
      ...trustedConfigDefinition,
      mode: 'display-only',
      allowScripts: false,
    });
  });

  it('allows trusted rapid scripts only when the runtime trust boundary is explicitly enabled', () => {
    const disabledService = configureService(false);

    expect(disabledService.trustedRapidScriptsEnabled()).toBeFalse();
    expect(disabledService.applyToDefinition(trustedConfigDefinition).mode).toBe('display-only');

    TestBed.resetTestingModule();
    const enabledService = configureService(true);

    expect(enabledService.trustedRapidScriptsEnabled()).toBeTrue();
    expect(enabledService.applyToDefinition(trustedConfigDefinition)).toEqual(trustedConfigDefinition);
  });

  it('documents that client checks are not the trust boundary', () => {
    const service = configureService();

    expect(service.trustBoundaryGuarantee()).toContain('backend/document permission model');
    expect(service.trustBoundaryGuarantee()).toContain('admin-only writes');
    expect(service.trustBoundaryGuarantee()).toContain('not the trust boundary');
  });
});

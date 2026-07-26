import { Inject, Injectable, InjectionToken } from '@angular/core';

import { RapidDefinition } from './rapidweb.types';

export const RAPID_TRUSTED_EXECUTION_ENABLED = new InjectionToken<boolean>('RAPID_TRUSTED_EXECUTION_ENABLED', {
  providedIn: 'root',
  factory: () => false,
});

const TRUST_BOUNDARY_GUARANTEE =
  'Trusted rapid scripts require the backend/document permission model to enforce admin-only writes for config.json and navigation.json; client checks are runtime safety gates, not the trust boundary.';

@Injectable({ providedIn: 'root' })
export class RapidTrustBoundaryService {
  constructor(@Inject(RAPID_TRUSTED_EXECUTION_ENABLED) private readonly trustedExecutionEnabled: boolean) {}

  trustedRapidScriptsEnabled(): boolean {
    return this.trustedExecutionEnabled === true;
  }

  applyToDefinition(definition: RapidDefinition): RapidDefinition {
    if (definition.mode !== 'trusted' || this.trustedRapidScriptsEnabled()) {
      return definition;
    }

    return {
      ...definition,
      mode: 'display-only',
      allowScripts: false,
    };
  }

  trustBoundaryGuarantee(): string {
    return TRUST_BOUNDARY_GUARANTEE;
  }
}

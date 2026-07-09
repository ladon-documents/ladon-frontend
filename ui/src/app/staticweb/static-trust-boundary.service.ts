import { Inject, Injectable, InjectionToken } from '@angular/core';

import { StaticDefinition } from './staticweb.types';

export const STATIC_TRUSTED_EXECUTION_ENABLED = new InjectionToken<boolean>('STATIC_TRUSTED_EXECUTION_ENABLED', {
  providedIn: 'root',
  factory: () => false,
});

const TRUST_BOUNDARY_GUARANTEE =
  'Trusted static scripts require the backend/document permission model to enforce admin-only writes for config.json and navigation.json; client checks are runtime safety gates, not the trust boundary.';

@Injectable({ providedIn: 'root' })
export class StaticTrustBoundaryService {
  constructor(@Inject(STATIC_TRUSTED_EXECUTION_ENABLED) private readonly trustedExecutionEnabled: boolean) {}

  trustedStaticScriptsEnabled(): boolean {
    return this.trustedExecutionEnabled === true;
  }

  applyToDefinition(definition: StaticDefinition): StaticDefinition {
    if (definition.mode !== 'trusted' || this.trustedStaticScriptsEnabled()) {
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

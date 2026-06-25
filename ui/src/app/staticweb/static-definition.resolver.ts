import { Injectable } from '@angular/core';

import { StaticPolicyProviderService } from './static-policy-provider.service';
import { StaticTrustBoundaryService } from './static-trust-boundary.service';
import { StaticUrlPolicyService } from './static-url-policy.service';
import { StaticPolicyResult, StaticResolveInput } from './staticweb.types';

@Injectable({ providedIn: 'root' })
export class StaticDefinitionResolver {
  private readonly localTrustedSources = new Set(['/public/html/test.html', '/public/html/authenticated.html']);

  constructor(
    private readonly policyProvider: StaticPolicyProviderService,
    private readonly urlPolicy: StaticUrlPolicyService,
    private readonly trustBoundary: StaticTrustBoundaryService,
  ) {}

  resolve(input: StaticResolveInput): StaticPolicyResult {
    const policyResult = this.policyProvider.resolve(input);
    if (policyResult.kind !== 'missing') {
      return this.withTrustedStaticGate(policyResult);
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
        return this.withTrustedStaticGate({
          kind: 'allow',
          definition: {
            source,
            mode: 'trusted',
            allowScripts: true,
            allowedScriptSources: 'same-origin',
          },
        });
      }

      return this.withTrustedStaticGate({
        kind: 'legacy',
        definition: {
          source,
          mode: 'display-only',
          allowScripts: false,
          allowedScriptSources: 'same-origin',
        },
      });
    } catch (error) {
      return { kind: 'invalid', error: error instanceof Error ? error.message : 'Invalid static source' };
    }
  }

  private withTrustedStaticGate(result: StaticPolicyResult): StaticPolicyResult {
    if (!result.definition) {
      return result;
    }

    return {
      ...result,
      definition: this.trustBoundary.applyToDefinition(result.definition),
    };
  }
}

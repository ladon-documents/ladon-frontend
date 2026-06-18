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
    if (policyResult.kind !== 'missing') {
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

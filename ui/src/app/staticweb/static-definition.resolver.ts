import { Injectable } from '@angular/core';

import { STATIC_ID_PATTERN } from './draco-static-config.service';
import { DracoStaticRegistryService } from './draco-static-registry.service';
import { StaticPolicyResult, StaticResolveInput } from './staticweb.types';

@Injectable({ providedIn: 'root' })
export class StaticDefinitionResolver {
  constructor(private readonly registry: DracoStaticRegistryService) {}

  resolve(input: StaticResolveInput): StaticPolicyResult {
    if (!input.staticId) {
      return { kind: 'invalid', error: 'No staticId requested' };
    }

    if (!STATIC_ID_PATTERN.test(input.staticId)) {
      return { kind: 'invalid', error: `Invalid staticId "${input.staticId}"` };
    }

    const entry = this.registry.getById(input.staticId);
    if (!entry) {
      return { kind: 'missing', error: `Static "${input.staticId}" was not found in the registry` };
    }

    return { kind: 'allow', definition: entry.definition };
  }
}

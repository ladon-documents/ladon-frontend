import { Injectable } from '@angular/core';

import { RAPID_ID_PATTERN } from './draco-rapid-config.service';
import { DracoRapidRegistryService } from './draco-rapid-registry.service';
import { RapidPolicyResult, RapidResolveInput } from './rapidweb.types';

@Injectable({ providedIn: 'root' })
export class RapidDefinitionResolver {
  constructor(private readonly registry: DracoRapidRegistryService) {}

  resolve(input: RapidResolveInput): RapidPolicyResult {
    if (!input.rapidId) {
      return { kind: 'invalid', error: 'No rapidId requested' };
    }

    if (!RAPID_ID_PATTERN.test(input.rapidId)) {
      return { kind: 'invalid', error: `Invalid rapidId "${input.rapidId}"` };
    }

    const entry = this.registry.getById(input.rapidId);
    if (!entry) {
      return { kind: 'missing', error: `Rapid "${input.rapidId}" was not found in the registry` };
    }

    return { kind: 'allow', definition: entry.definition };
  }
}

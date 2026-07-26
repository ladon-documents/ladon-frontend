import { Injectable } from '@angular/core';

import { RapidPolicyProvider, RapidPolicyResult, RapidResolveInput } from './rapidweb.types';

@Injectable({ providedIn: 'root' })
export class RapidPolicyProviderService implements RapidPolicyProvider {
  resolve(_input: RapidResolveInput): RapidPolicyResult {
    return { kind: 'missing', error: 'Rapid API policy endpoint is not implemented yet' };
  }
}

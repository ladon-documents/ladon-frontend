import { Injectable } from '@angular/core';

import { StaticPolicyProvider, StaticPolicyResult, StaticResolveInput } from './staticweb.types';

@Injectable({ providedIn: 'root' })
export class StaticPolicyProviderService implements StaticPolicyProvider {
  resolve(_input: StaticResolveInput): StaticPolicyResult {
    return { kind: 'missing', error: 'Static API policy endpoint is not implemented yet' };
  }
}

import { TestBed } from '@angular/core/testing';

import { StaticPolicyProviderService } from './static-policy-provider.service';

describe('StaticPolicyProviderService', () => {
  let provider: StaticPolicyProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    provider = TestBed.inject(StaticPolicyProviderService);
  });

  it('returns missing until an API-backed policy endpoint exists', () => {
    expect(provider.resolve({ staticId: 'my-static' }).kind).toBe('missing');
  });
});

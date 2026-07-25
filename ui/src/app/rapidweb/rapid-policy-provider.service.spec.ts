import { TestBed } from '@angular/core/testing';

import { RapidPolicyProviderService } from './rapid-policy-provider.service';

describe('RapidPolicyProviderService', () => {
  let provider: RapidPolicyProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    provider = TestBed.inject(RapidPolicyProviderService);
  });

  it('returns missing until an API-backed policy endpoint exists', () => {
    expect(provider.resolve({ rapidId: 'my-rapid' }).kind).toBe('missing');
  });
});

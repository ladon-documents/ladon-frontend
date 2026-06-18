import { TestBed } from '@angular/core/testing';

import { StaticPolicyProviderService } from './static-policy-provider.service';

describe('StaticPolicyProviderService', () => {
  let provider: StaticPolicyProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    provider = TestBed.inject(StaticPolicyProviderService);
  });

  it('returns missing until an API-backed policy endpoint exists', () => {
    expect(provider.resolve({ htmlId: 'my-static' }).kind).toBe('missing');
  });

  it('returns missing for legacy page input and lets the resolver apply local fallback rules', () => {
    expect(provider.resolve({ page: './public/html/test.html' }).kind).toBe('missing');
  });
});

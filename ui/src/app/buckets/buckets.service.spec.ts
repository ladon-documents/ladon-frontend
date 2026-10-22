import { TestBed } from '@angular/core/testing';
import { BucketsService } from './buckets.service';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('BucketsService', () => {
  let service: BucketsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: smokeTestProviders(),
    });
    service = TestBed.inject(BucketsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

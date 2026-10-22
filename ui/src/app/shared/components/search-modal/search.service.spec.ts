import { TestBed } from '@angular/core/testing';

import { SearchService } from './search.service';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('SearchService', () => {
  let service: SearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: smokeTestProviders(),
    });
    service = TestBed.inject(SearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

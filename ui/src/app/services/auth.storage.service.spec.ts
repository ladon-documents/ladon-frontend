import { TestBed } from '@angular/core/testing';

import { AuthStorageService } from './auth.storage.service';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('AuthStorageService', () => {
  let service: AuthStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: smokeTestProviders(),
    });
    service = TestBed.inject(AuthStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

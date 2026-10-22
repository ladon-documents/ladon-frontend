import { TestBed } from '@angular/core/testing';

import { UsermanagerService } from './usermanager.service';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('UsermanagerService', () => {
  let service: UsermanagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: smokeTestProviders(),
    });
    service = TestBed.inject(UsermanagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

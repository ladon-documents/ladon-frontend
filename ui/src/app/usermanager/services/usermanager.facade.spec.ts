import { TestBed } from '@angular/core/testing';

import { UsermanagerFacade } from './usermanager.facade';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('UsermanagerFacade', () => {
  let service: UsermanagerFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: [UsermanagerFacade, ...smokeTestProviders()],
    });
    service = TestBed.inject(UsermanagerFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

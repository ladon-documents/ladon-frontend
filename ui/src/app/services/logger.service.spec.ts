import { TestBed } from '@angular/core/testing';

import { LoggerService } from './logger.service';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: smokeTestProviders(),
    });
    service = TestBed.inject(LoggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

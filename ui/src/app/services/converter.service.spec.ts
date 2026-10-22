import { TestBed } from '@angular/core/testing';

import { ConverterService } from './converter.service';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('ConverterService', () => {
  let service: ConverterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: smokeTestProviders(),
    });
    service = TestBed.inject(ConverterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

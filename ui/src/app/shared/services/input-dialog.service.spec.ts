import { TestBed } from '@angular/core/testing';

import { InputDialogService } from './input-dialog.service';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('InputDialogService', () => {
  let service: InputDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: smokeTestProviders(),
    });
    service = TestBed.inject(InputDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

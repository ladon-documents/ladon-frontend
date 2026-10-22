import { TestBed } from '@angular/core/testing';

import { ConfirmationDialogService } from './confirmation-dialog.service';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('ConfirmationDialogService', () => {
  let service: ConfirmationDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: smokeTestProviders(),
    });
    service = TestBed.inject(ConfirmationDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

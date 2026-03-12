import { TestBed } from '@angular/core/testing';

import { InputDialogService } from './input-dialog.service';

describe('InputDialogService', () => {
  let service: InputDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InputDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

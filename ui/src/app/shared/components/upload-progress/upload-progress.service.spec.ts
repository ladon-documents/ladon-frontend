import { TestBed } from '@angular/core/testing';

import { UploadProgressService } from './upload-progress.service';

describe('UploadProgressService', () => {
  let service: UploadProgressService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UploadProgressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

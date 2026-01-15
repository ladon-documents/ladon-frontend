import { TestBed } from '@angular/core/testing';

import { FilemanagerContentFacade } from './filemanager-content.facade';

describe('FilemanagerContentFacadeService', () => {
  let service: FilemanagerContentFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilemanagerContentFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

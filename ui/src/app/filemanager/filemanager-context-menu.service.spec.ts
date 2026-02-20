import { TestBed } from '@angular/core/testing';

import { FilemanagerContextMenuService } from './filemanager-context-menu.service';

describe('FilemanagerContextMenuService', () => {
  let service: FilemanagerContextMenuService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilemanagerContextMenuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

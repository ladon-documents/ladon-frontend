import { TestBed } from '@angular/core/testing';

import { FilemanagerContextMenuService } from './filemanager-context-menu.service';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('FilemanagerContextMenuService', () => {
  let service: FilemanagerContextMenuService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: smokeTestProviders(),
    });
    service = TestBed.inject(FilemanagerContextMenuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

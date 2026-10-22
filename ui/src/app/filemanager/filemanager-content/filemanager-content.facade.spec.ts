import { TestBed } from '@angular/core/testing';

import { FilemanagerContentFacade } from './filemanager-content.facade';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('FilemanagerContentFacadeService', () => {
  let service: FilemanagerContentFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: smokeTestProviders(),
    });
    service = TestBed.inject(FilemanagerContentFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

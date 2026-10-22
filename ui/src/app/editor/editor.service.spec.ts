import { TestBed } from '@angular/core/testing';

import { MonacoEditorService } from './editor.service';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('EditorService', () => {
  let service: MonacoEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: smokeTestProviders(),
    });
    service = TestBed.inject(MonacoEditorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

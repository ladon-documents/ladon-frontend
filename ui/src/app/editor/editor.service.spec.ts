import { TestBed } from '@angular/core/testing';

import { MonacoEditorService } from './editor.service';

describe('EditorService', () => {
  let service: MonacoEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MonacoEditorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

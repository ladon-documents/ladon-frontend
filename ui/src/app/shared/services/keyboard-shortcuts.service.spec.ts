import { TestBed } from '@angular/core/testing';

import { KeyboardShortcutsService } from './keyboard-shortcuts.service';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('KeyboardShortcutsService', () => {
  let service: KeyboardShortcutsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: smokeTestProviders(),
    });
    service = TestBed.inject(KeyboardShortcutsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

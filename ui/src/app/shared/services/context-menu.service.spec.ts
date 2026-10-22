import { TestBed } from '@angular/core/testing';

import { ContextMenuService } from './context-menu.service';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('ContextMenuService', () => {
  let service: ContextMenuService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: smokeTestProviders(),
    });
    service = TestBed.inject(ContextMenuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

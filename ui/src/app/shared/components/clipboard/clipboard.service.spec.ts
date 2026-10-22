import { TestBed } from '@angular/core/testing';

import { ClipboardService } from './clipboard.service';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('ClipboardService', () => {
  let service: ClipboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: smokeTestProviders(),
    });
    service = TestBed.inject(ClipboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

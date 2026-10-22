import { TestBed } from '@angular/core/testing';

import { ToastService } from './toast.service';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: smokeTestProviders(),
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

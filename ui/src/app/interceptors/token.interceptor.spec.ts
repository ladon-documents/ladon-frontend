import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn } from '@angular/common/http';

import { tokenInterceptor } from './token.interceptor';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('tokenInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => tokenInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: smokeTestProviders(),
    });
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });
});

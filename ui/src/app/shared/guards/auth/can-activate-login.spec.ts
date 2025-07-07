import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { canActivateLogin } from './can-activate.login';

describe('canActivateLoginGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => canActivateLogin(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

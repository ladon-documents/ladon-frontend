import { TestBed } from '@angular/core/testing';

import { UsermanagerFacade } from './usermanager.facade';

describe('UsermanagerFacade', () => {
  let service: UsermanagerFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsermanagerFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

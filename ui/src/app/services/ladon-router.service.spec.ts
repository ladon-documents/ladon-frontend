import { TestBed } from '@angular/core/testing';

import { LadonRouterService } from './ladon-router.service';

describe('LadonRouterService', () => {
  let service: LadonRouterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LadonRouterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

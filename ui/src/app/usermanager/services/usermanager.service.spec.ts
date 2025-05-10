import { TestBed } from '@angular/core/testing';

import { UsermanagerService } from './usermanager.service';

describe('UsermanagerService', () => {
  let service: UsermanagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsermanagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

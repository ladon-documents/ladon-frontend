import { TestBed } from '@angular/core/testing';
import Storage from "./storage.service";

describe('Storage', () => {
  let service: Storage<any>;

  beforeEach(() => {
    TestBed.configureTestingModule({});

  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

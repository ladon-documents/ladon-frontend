import { TestBed } from '@angular/core/testing';

import { TaskmanagerService } from './taskmanager.service';

describe('TaskmanagerService', () => {
  let service: TaskmanagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskmanagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

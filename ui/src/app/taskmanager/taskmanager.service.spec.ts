import { TestBed } from '@angular/core/testing';

import { TaskmanagerService } from './taskmanager.service';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('TaskmanagerService', () => {
  let service: TaskmanagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: smokeTestProviders(),
    });
    service = TestBed.inject(TaskmanagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

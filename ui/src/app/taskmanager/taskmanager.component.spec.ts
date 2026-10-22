import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskmanagerComponent } from './taskmanager.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('TaskmanagerComponent', () => {
  let component: TaskmanagerComponent;
  let fixture: ComponentFixture<TaskmanagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskmanagerComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(TaskmanagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

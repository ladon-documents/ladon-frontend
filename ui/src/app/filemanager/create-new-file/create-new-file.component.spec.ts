import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNewFileComponent } from './create-new-file.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('CreateNewFileComponent', () => {
  let component: CreateNewFileComponent;
  let fixture: ComponentFixture<CreateNewFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateNewFileComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(CreateNewFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

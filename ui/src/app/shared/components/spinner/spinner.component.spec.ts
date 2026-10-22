import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpinnerComponent } from './spinner.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('SpinnerComponent', () => {
  let component: SpinnerComponent;
  let fixture: ComponentFixture<SpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpinnerComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(SpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

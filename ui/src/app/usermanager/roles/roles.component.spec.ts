import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolesComponent } from './roles.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('RolesComponent', () => {
  let component: RolesComponent;
  let fixture: ComponentFixture<RolesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolesComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(RolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

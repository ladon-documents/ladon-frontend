import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleDetailsComponent } from './role-details.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('RoleDetailsComponent', () => {
  let component: RoleDetailsComponent;
  let fixture: ComponentFixture<RoleDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleDetailsComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(RoleDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

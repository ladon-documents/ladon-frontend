import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemesComponent } from './themes.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('ThemesComponent', () => {
  let component: ThemesComponent;
  let fixture: ComponentFixture<ThemesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemesComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(ThemesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AsideComponent } from './aside.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('AsideComponent', () => {
  let component: AsideComponent;
  let fixture: ComponentFixture<AsideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsideComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(AsideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

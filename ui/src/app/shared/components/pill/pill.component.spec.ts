import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PillComponent } from './pill.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('PillComponent', () => {
  let component: PillComponent;
  let fixture: ComponentFixture<PillComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PillComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(PillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

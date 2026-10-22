import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaComponent } from './meta.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('MetaComponent', () => {
  let component: MetaComponent;
  let fixture: ComponentFixture<MetaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetaComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(MetaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

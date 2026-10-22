import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BucketsComponent } from './buckets.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('BucketsComponent', () => {
  let component: BucketsComponent;
  let fixture: ComponentFixture<BucketsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BucketsComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(BucketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BucketsComponent } from './buckets.component';

describe('BucketsComponent', () => {
  let component: BucketsComponent;
  let fixture: ComponentFixture<BucketsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BucketsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BucketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

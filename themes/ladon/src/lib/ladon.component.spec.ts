import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LadonComponent } from './ladon.component';

describe('LadonComponent', () => {
  let component: LadonComponent;
  let fixture: ComponentFixture<LadonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LadonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LadonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadsComponent } from './uploads.component';

describe('UploadsComponent', () => {
  let component: UploadsComponent;
  let fixture: ComponentFixture<UploadsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

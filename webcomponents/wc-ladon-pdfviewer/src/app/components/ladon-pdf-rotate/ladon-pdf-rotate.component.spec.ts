import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LadonPdfRotateComponent } from './ladon-pdf-rotate.component';

describe('LadonPdfRotateComponent', () => {
  let component: LadonPdfRotateComponent;
  let fixture: ComponentFixture<LadonPdfRotateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LadonPdfRotateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LadonPdfRotateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

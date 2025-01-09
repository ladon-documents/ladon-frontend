import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LadonPdfPrintComponent } from './ladon-pdf-print.component';

describe('LadonPdfPrintComponent', () => {
  let component: LadonPdfPrintComponent;
  let fixture: ComponentFixture<LadonPdfPrintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LadonPdfPrintComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LadonPdfPrintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

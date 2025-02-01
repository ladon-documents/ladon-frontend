import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LadonPdfOpenFileComponent } from './ladon-pdf-open-file.component';

describe('LadonPdfOpenFileComponent', () => {
  let component: LadonPdfOpenFileComponent;
  let fixture: ComponentFixture<LadonPdfOpenFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LadonPdfOpenFileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LadonPdfOpenFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

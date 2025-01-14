import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LadonPdfPresentationModeComponent } from './ladon-pdf-presentation-mode.component';

describe('LadonPdfPresentationModeComponent', () => {
  let component: LadonPdfPresentationModeComponent;
  let fixture: ComponentFixture<LadonPdfPresentationModeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LadonPdfPresentationModeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LadonPdfPresentationModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

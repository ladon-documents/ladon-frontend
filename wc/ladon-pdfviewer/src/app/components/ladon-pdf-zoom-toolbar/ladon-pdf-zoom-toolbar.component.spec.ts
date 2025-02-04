import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LadonPdfZoomToolbarComponent } from './ladon-pdf-zoom-toolbar.component';

describe('LadonPdfZoomToolbarComponent', () => {
  let component: LadonPdfZoomToolbarComponent;
  let fixture: ComponentFixture<LadonPdfZoomToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LadonPdfZoomToolbarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LadonPdfZoomToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

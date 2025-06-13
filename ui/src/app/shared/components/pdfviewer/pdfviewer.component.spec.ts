import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfviewerComponent } from './pdfviewer.component';

describe('PdfviewerComponent', () => {
  let component: PdfviewerComponent;
  let fixture: ComponentFixture<PdfviewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfviewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfviewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

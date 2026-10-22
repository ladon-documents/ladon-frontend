import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfviewerComponent } from './pdfviewer.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('PdfviewerComponent', () => {
  let component: PdfviewerComponent;
  let fixture: ComponentFixture<PdfviewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfviewerComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(PdfviewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

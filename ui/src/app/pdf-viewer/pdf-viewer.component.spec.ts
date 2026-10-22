import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfViewerComponent } from './pdf-viewer.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('PdfViewerComponent', () => {
  let component: PdfViewerComponent;
  let fixture: ComponentFixture<PdfViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfViewerComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(PdfViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkdownViewerComponent } from './markdown-viewer.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('MarkdownViewerComponent', () => {
  let component: MarkdownViewerComponent;
  let fixture: ComponentFixture<MarkdownViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkdownViewerComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

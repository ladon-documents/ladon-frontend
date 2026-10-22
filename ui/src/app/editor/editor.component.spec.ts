import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonacoEditorComponent } from './editor.component';

describe('MonacoEditorComponent', () => {
  let component: MonacoEditorComponent;
  let fixture: ComponentFixture<MonacoEditorComponent>;

  beforeEach(async () => {
    // Monaco is loaded from a CDN at runtime. In unit tests it is not present, so
    // we ensure `typeof monaco` is 'undefined' to exercise the graceful lazy-load
    // path (a real network fetch must not happen in Karma).
    (window as unknown as { monaco?: unknown }).monaco = undefined;

    await TestBed.configureTestingModule({
      imports: [MonacoEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonacoEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to the javascript language and dark theme', () => {
    expect(component.language).toBe('javascript');
    expect(component.theme).toBe('vs-dark');
  });
});

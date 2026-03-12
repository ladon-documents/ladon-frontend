import { TestBed } from '@angular/core/testing';
import { ImageEditorComponent } from './app.component';

describe('ImageEditorComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageEditorComponent],
    }).compileComponents();
  });

  it('creates component', () => {
    const fixture = TestBed.createComponent(ImageEditorComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});

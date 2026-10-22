import { ElementRef, Renderer2 } from '@angular/core';
import { FileUploadDirective } from './file-upload.directive';

describe('FileUploadDirective', () => {
  it('should create an instance', () => {
    const elementRef = new ElementRef(document.createElement('div'));
    const renderer = jasmine.createSpyObj('Renderer2', [
      'addClass',
      'removeClass',
      'addEventListener',
      'removeEventListener',
    ]) as unknown as Renderer2;
    const directive = new FileUploadDirective(elementRef, renderer);
    expect(directive).toBeTruthy();
  });

  it('should default to accepting multiple files with a 10 MB limit', () => {
    const elementRef = new ElementRef(document.createElement('div'));
    // `createSpyObj` rejects an empty method array, so declare the handlers the
    // directive actually uses (drag events); none are invoked by the constructor.
    const renderer = jasmine.createSpyObj('Renderer2', ['addClass', 'removeClass']) as unknown as Renderer2;
    const directive = new FileUploadDirective(elementRef, renderer);
    expect(directive.allowMultiple).toBeTrue();
    expect(directive.maxFileSize).toBe(10 * 1024 * 1024);
  });
});

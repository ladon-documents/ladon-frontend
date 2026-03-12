import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageEditorComponent } from './app/app.component';

export async function createImageEditorElement() {
  const app = await createApplication({
    providers: [importProvidersFrom(CommonModule)],
  });

  const imageEditorElement = createCustomElement(ImageEditorComponent, {
    injector: app.injector,
  });

  customElements.define('ladon-image-editor', imageEditorElement);

  return imageEditorElement;
}

export function defineImageEditorElement() {
  if (!customElements.get('ladon-image-editor')) {
    createImageEditorElement();
  }
}

defineImageEditorElement();

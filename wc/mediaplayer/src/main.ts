import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaPlayerComponent } from './app/app.component';

export async function createMediaPlayerElement() {
  const app = await createApplication({
    providers: [importProvidersFrom(CommonModule)],
  });

  const mediaPlayerElement = createCustomElement(MediaPlayerComponent, {
    injector: app.injector,
  });

  customElements.define('ladon-media-player', mediaPlayerElement);

  return mediaPlayerElement;
}

export function defineMediaPlayerElement() {
  if (!customElements.get('ladon-media-player')) {
    void createMediaPlayerElement();
  }
}

defineMediaPlayerElement();

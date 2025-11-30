import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { AudioPlayerComponent } from './app/app.component';

import { CommonModule } from '@angular/common';

export async function createAudioPlayerElement() {
  const app = await createApplication({
    providers: [
      importProvidersFrom(CommonModule),
    ]
  });

  const audioPlayerElement = createCustomElement(AudioPlayerComponent, {
    injector: app.injector
  });

  customElements.define('ladon-audioplayer', audioPlayerElement);

  return audioPlayerElement;
}

export function defineAudioPlayerElement() {
  if (!customElements.get('ladon-audioplayer')) {
    createAudioPlayerElement();
  }
}

defineAudioPlayerElement();

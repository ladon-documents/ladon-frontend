import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';

(async () => {
  const app = await createApplication(appConfig);
  const toogleElement = createCustomElement(AppComponent, {
    injector: app.injector,
  });
  customElements.define('ladon-clipboard', toogleElement);
})();

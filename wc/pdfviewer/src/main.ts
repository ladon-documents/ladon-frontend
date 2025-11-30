import { createApplication} from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { PdfviewerComponent } from './app/pdfviewer.component';
import {createCustomElement} from "@angular/elements";

(async () => {

  const app = await createApplication(appConfig);

  const toogleElement = createCustomElement(PdfviewerComponent, {
    injector: app.injector,
  });

  customElements.define('ladon-pdfviewer', toogleElement);

})();

import {createApplication} from "@angular/platform-browser";
import {createCustomElement} from "@angular/elements";
import {PdfviewerComponent} from "./pdfviewer.component";

(async () => {

  const app = await createApplication();

  const toogleElement = createCustomElement(PdfviewerComponent, {
    injector: app.injector,
  });

  customElements.define('ladon-pdfviewer', toogleElement);

})();

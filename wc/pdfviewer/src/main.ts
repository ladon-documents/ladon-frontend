import { createApplication} from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { PdfviewerComponent } from './app/pdfviewer.component';
import {createCustomElement} from "@angular/elements";


export async function createPdfViewerElement() {
  const app = await createApplication(appConfig);

  const pdfViewerElement = createCustomElement(PdfviewerComponent, {
    injector: app.injector
  });

  customElements.define('ladon-pdfviewer', pdfViewerElement);

  return pdfViewerElement;
}

export function definePdfViewerElement() {
  if (!customElements.get('ladon-pdfviewer')) {
    createPdfViewerElement();
  }
}

definePdfViewerElement();

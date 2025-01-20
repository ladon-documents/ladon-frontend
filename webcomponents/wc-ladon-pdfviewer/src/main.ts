import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { PdfviewerComponent } from './app/pdfviewer.component';

bootstrapApplication(PdfviewerComponent, appConfig)
  .catch((err) => console.error(err));

import { Routes } from '@angular/router';
import { PdfViewerComponent } from './pdf-viewer.component';
import { PdfViewerResolver } from './pdf-viewer.resolver';
import { environment } from '../../environments/environment';

export const pdfviewerRoutes: Routes = [
  {
    path: `${environment.baseHref}/pdf`,
    component: PdfViewerComponent,
    resolve: {
      selectedDocument: PdfViewerResolver,
    }
  },
];

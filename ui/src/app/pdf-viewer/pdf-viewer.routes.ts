import { Routes } from '@angular/router';
import { PdfViewerComponent } from './pdf-viewer.component';
import { PdfViewerResolver } from './pdf-viewer.resolver';
import { environment } from '../../environments/environment';
import { AuthGuard } from '@ladon/shared';

export const pdfviewerRoutes: Routes = [
  {
    path: `${environment.baseHref}/pdf`,
    component: PdfViewerComponent,
    canActivate: [AuthGuard],
    resolve: {
      selectedDocument: PdfViewerResolver,
    },
  },
];

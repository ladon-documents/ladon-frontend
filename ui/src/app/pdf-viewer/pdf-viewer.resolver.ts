import { inject, Injectable } from '@angular/core';
import { Resolve, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AppStore } from '../store/app.store';
import { LadonRouterService } from '../services/ladon-router.service';
import { PdfViewerStore } from '../store/pdf-viewer.store';
import { DocumentModel } from '../../api';
import { isPdfDocument } from '@ladon/utility';

@Injectable({
  providedIn: 'root',
})
export class PdfViewerResolver implements Resolve<undefined | DocumentModel> {
  readonly #router = inject(LadonRouterService);
  readonly #pdfViewerStore = inject(PdfViewerStore);

  resolve(): Observable<undefined | DocumentModel> {
    const selectedDocument = this.#pdfViewerStore.selectedDocument();
    if (selectedDocument && isPdfDocument(selectedDocument)) {
      //this.#router.navigateToPdfViewer(selectedDocument.path);
      return of(selectedDocument);
    }
    return of(undefined);
  }
}

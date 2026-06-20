import { inject, Injectable } from '@angular/core';
import { Resolve, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AppStore } from '../store/app.store';
import { LadonRouterService } from '../services/ladon-router.service';
import { PdfViewerStore } from '../store/pdf-viewer.store';
import { Document } from '@ladon/api';
import { isPdfDocument } from '@ladon/utility';

@Injectable({
  providedIn: 'root',
})
export class PdfViewerResolver implements Resolve<undefined | Document> {
  readonly #router = inject(LadonRouterService);
  readonly #pdfViewerStore = inject(PdfViewerStore);

  resolve(): Observable<undefined | Document> {
    const selectedDocument = this.#pdfViewerStore.selectedDocument();
    if (selectedDocument && isPdfDocument(selectedDocument)) {
      //this.#router.navigateToPdfViewer(selectedDocument.path);
      return of(selectedDocument);
    }
    return of(undefined);
  }
}

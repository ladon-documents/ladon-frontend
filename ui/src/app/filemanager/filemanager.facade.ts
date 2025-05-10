import { inject, Injectable } from '@angular/core';
import { FilemanagerStore } from '../store/filemanager.store';
import { DocumentModel } from '../../api';

@Injectable({
  providedIn: 'root',
})
export class FilemanagerFacade {
  readonly #store = inject(FilemanagerStore);

  constructor() {
    /*
    this.documents$ = store.select(documentsQuery.getDocuments);
    this.selectedDocumentId$ = this.store.select(documentsQuery.getSelectedDocumentId);
    this.loadStatus$ = this.store.select(documentsQuery.getLoadStatus);
    this.totalCount$ = this.store.select(documentsQuery.getTotalDocuments);
    this.currentBucket$ = this.store.select(documentsQuery.getCurrentBucket);
    this.breadcrumb$ = this.store.select(selectBreadcrumb);

    this.initActionListener();
     */
  }
  documents() {
    return this.#store.documents;
  }
  loadBucket(bucket: string) {
    this.#store.loadBucket(bucket);
  }

  load(document: DocumentModel): void {
    this.#store.loadDocumentList(document);
  }

  loadByKey(document: DocumentModel): void {
    if (document && document.key) {
    }
  }

  delete(document: DocumentModel): void {}

  updateFolder(document: DocumentModel): void {}

  updateFile(document: DocumentModel): void {}
}

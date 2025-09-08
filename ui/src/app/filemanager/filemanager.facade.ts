import { inject, Injectable, Signal } from '@angular/core';
import { FilemanagerStore } from '../store/filemanager.store';
import { DocumentModel } from '../../api';
import { BreadcrumbStore } from '../store/breadcrumb.store';
import { LadonRouterService } from '../services/ladon-router.service';

@Injectable({
  providedIn: 'root',
})
export class FilemanagerFacade {
  readonly #filemanagerStore = inject(FilemanagerStore);
  readonly #breadcrumbStore = inject(BreadcrumbStore);
  readonly ladonRouterService = inject(LadonRouterService);
  readonly documents: Signal<DocumentModel[]> = this.#filemanagerStore.documents;
  readonly selectedBucket = this.#filemanagerStore.selectedBucket;
  readonly error = this.#filemanagerStore.error;
  readonly statistics = this.#filemanagerStore.statistics;
  constructor() {}

  initRoot() {
    const currentBucket = this.selectedBucket();
    if (currentBucket) {
      this.#filemanagerStore.navigateToFilemanagerWithBucket(currentBucket);
    }
  }

  loadBucket(bucket: string) {
    this.#filemanagerStore.loadBucket(bucket);
  }

  loadStats() {
    this.#filemanagerStore.loadStats(this.selectedBucket());
  }

  load(document: DocumentModel): void {
    if (!document) return;
    const currentBucket = this.selectedBucket();
    if (document.isFolder && currentBucket && document.key) {
      this.#filemanagerStore.loadDocumentList(document);
      this.ladonRouterService.navigateToFolder(currentBucket, document.key);
    }
  }

  createFolder(folderName: string) {
    const currentPath =this.#breadcrumbStore.currentPath()?.key;
     this.#filemanagerStore.createFolder({ folderName, currentPath });
  }


  showRoot() {
    this.#breadcrumbStore.reset();
    this.initRoot();
  }

  loadByKey(document: DocumentModel): void {
    if (document && document.key) {
    }
  }
  setCurrentFolder(document: DocumentModel) {

  }

  delete(document: DocumentModel): void {}

  updateFolder(document: DocumentModel): void {}

  updateFile(document: DocumentModel): void {}

  reset(): void {
    this.#filemanagerStore.resetFilemanagerStore();
    const selectedDocument = this.#breadcrumbStore.reset();
  }

  navigateBreadcrumb(index: number): void {
    const selectedDocument = this.#breadcrumbStore.navigateToIndex(index);
    if (selectedDocument) {
      this.load(selectedDocument);
    }
  }

}

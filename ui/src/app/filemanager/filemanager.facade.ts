import { inject, Injectable, Signal } from '@angular/core';
import { FilemanagerStore } from '../store/filemanager.store';
import { DocumentModel } from '../../api';
import { BreadcrumbStore } from '../store/breadcrumb.store';
import { LadonRouterService } from '../services/ladon-router.service';
import { ConverterService } from '../services/converter.service';
import { FilemanagerService } from './filemanager.service';

@Injectable({
  providedIn: 'root',
})
export class FilemanagerFacade {
  readonly #filemanagerStore = inject(FilemanagerStore);
  readonly #breadcrumbStore = inject(BreadcrumbStore);
  readonly #converterService = inject(ConverterService);
  readonly ladonRouterService = inject(LadonRouterService);
  readonly filemanagerSerivce = inject(FilemanagerService);
  readonly documents: Signal<DocumentModel[]> = this.#filemanagerStore.documents;
  readonly selectedBucket = this.#filemanagerStore.selectedBucket;
  readonly error = this.#filemanagerStore.error;
  readonly statistics = this.#filemanagerStore.statistics;
  readonly selectedDocument = this.#filemanagerStore.selectedDocument;
  readonly viewMode = this.#filemanagerStore.viewMode;
  readonly pagination = this.#filemanagerStore.pagination;

  constructor() {}

  initRoot() {
    const currentBucket = this.selectedBucket();
    if (currentBucket) {
      this.#filemanagerStore.navigateToFilemanagerWithBucket(currentBucket);
    }
  }

  setViewMode(mode: 'card' | 'table') {
    this.#filemanagerStore.setViewMode(mode);
  }
  // Pagination methods
  setPageSize(pageSize: number) {
    this.#filemanagerStore.setPageSize(pageSize);
  }

  goToPage(page: number) {
    this.#filemanagerStore.goToPage(page);
  }

  nextPage() {
    this.#filemanagerStore.nextPage();
  }

  previousPage() {
    this.#filemanagerStore.previousPage();
  }

  firstPage() {
    this.#filemanagerStore.firstPage();
  }

  lastPage() {
    this.#filemanagerStore.lastPage();
  }


  setSelectedDocument(document: DocumentModel) {
    this.#filemanagerStore.setSelectedDocument(document);
  }

  loadBucket(bucket: string) {
    this.#filemanagerStore.loadBucket(bucket);
  }

  loadStats() {
    this.#filemanagerStore.loadStats(this.selectedBucket());
  }

  getDocument(document: DocumentModel) {
    return this.filemanagerSerivce.getDocument(document)
  }
  saveDocument(document: DocumentModel, content:any) {
    return this.filemanagerSerivce.saveDocument(document, content)
  }
  async getImagePreviewUrll() {
    try {
      const document = this.#filemanagerStore.selectedDocument();
      if (!document) return null;
      const imageUrl = await this.#converterService.getPreview(document);
      return imageUrl;
    } catch (error) {
      throw error;
    }
  }

  load(document: DocumentModel): void {
    if (!document) return;
    const currentBucket = this.selectedBucket();
    if (document.isFolder && currentBucket && document.key) {
      this.#filemanagerStore.loadDocumentList(document);
      this.ladonRouterService.navigateToFolder(currentBucket, document.key);
    }
  }

  createEmptyFile(fileName: string) {
    const currentPath = this.getCurrentPath();
  //  this.#filemanagerStore.createNewFile({ fileName, currentPath });
  }

  createFolder(folderName: string) {
    const currentPath =this.getCurrentPath()
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

  private getCurrentPath(): string | undefined {
    return this.#breadcrumbStore.currentPath()?.key
  }

}

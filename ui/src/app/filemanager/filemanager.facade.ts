import { inject, Injectable, Signal } from '@angular/core';
import { FilemanagerStore } from '../store/filemanager.store';
import { Document } from '@ladon/api';
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
  readonly documents: Signal<Document[]> = this.#filemanagerStore.documents;
  readonly selectedBucket = this.#filemanagerStore.selectedBucket;
  readonly error = this.#filemanagerStore.error;
  readonly statistics = this.#filemanagerStore.statistics;
  readonly selectedDocument = this.#filemanagerStore.selectedDocument;
  readonly currentFolder = this.#filemanagerStore.currentFolder;
  readonly viewMode = this.#filemanagerStore.viewMode;
  readonly pagination = this.#filemanagerStore.pagination;

  readonly searchTerm = this.#filemanagerStore.searchTerm;
  readonly sortConfig = this.#filemanagerStore.sort;
  readonly isLoading = this.#filemanagerStore.isLoading;

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
  setSearchTerm(searchTerm: string) {
    this.#filemanagerStore.setSearchTerm(searchTerm);
  }

  clearSearch() {
    this.#filemanagerStore.clearSearch();
  }

  setSortConfig(field: 'name' | 'size' | 'type' | 'lastModified' | 'created', direction?: 'asc' | 'desc') {
    this.#filemanagerStore.setSortConfig(field, direction);
  }

  toggleSort(field: 'name' | 'size' | 'type' | 'lastModified' | 'created') {
    this.#filemanagerStore.setSortConfig(field);
  }

  setSelectedDocument(document: Document) {
    this.#filemanagerStore.setSelectedDocument(document);
  }

  loadBucket(bucket: string) {
    this.#filemanagerStore.loadBucket(bucket);
  }

  reloadBucket() {
    if (this.selectedBucket() === undefined) return;
    this.#filemanagerStore.loadBucket(this.selectedBucket());
  }

  reloadCurrentLocation() {
    const currentFolder = this.currentFolder();
    if (currentFolder) {
      this.#filemanagerStore.loadDocumentList({
        document: currentFolder,
        updateBreadcrumb: false,
      });
      return;
    }

    const currentBucket = this.selectedBucket();
    if (currentBucket) {
      this.#filemanagerStore.loadBucket(currentBucket);
    }
  }

  loadStats() {
    this.#filemanagerStore.loadStats(this.selectedBucket());
  }

  getDocument(document: Document) {
    return this.filemanagerSerivce.getDocument(document);
  }
  saveDocument(document: Document, content: Blob) {
    return this.filemanagerSerivce.saveDocument(document, content);
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

  load(document: Document): void {
    if (!document) return;
    const currentBucket = this.selectedBucket();
    if (document.isFolder && currentBucket && document.key) {
      this.#filemanagerStore.loadDocumentList(document);
      this.ladonRouterService.navigateToFolder(currentBucket, document.key);
    }
  }

  createEmptyFile(fileName: string) {
    const currentPath = this.getCurrentPath();
    this.#filemanagerStore.createFile({ fileName, currentPath });
  }

  createFolder(folderName: string) {
    const currentPath = this.getCurrentPath();
    this.#filemanagerStore.createFolder({ folderName, currentPath });
  }

  showRoot() {
    this.#breadcrumbStore.reset();
    this.initRoot();
  }

  loadByKey(document: Document): void {
    if (document && document.key) {
    }
  }

  setCurrentFolder(document: Document) {}

  delete(document: Document): void {
    this.#filemanagerStore.deleteDocument(document);
  }
  moveDocument(documentModel: Document): void {
    const targetPath = this.getCurrentPath() ?? '';
    this.#filemanagerStore.moveDocument({
      document: documentModel,
      targetPath,
    });
  }

  moveDocuments(documentModels: Document[]): void {
    if (documentModels.length === 0) {
      return;
    }

    const targetPath = this.getCurrentPath() ?? '';
    this.#filemanagerStore.moveDocuments({
      documents: documentModels,
      targetPath,
    });
  }

  copyDocument(documentModel: Document): void {
    const targetPath = this.getCurrentPath() ?? '';
    this.#filemanagerStore.copyDocument({
      document: documentModel,
      targetPath,
    });
  }

  copyDocuments(documentModels: Document[]): void {
    if (documentModels.length === 0) {
      return;
    }

    const targetPath = this.getCurrentPath() ?? '';
    this.#filemanagerStore.copyDocuments({
      documents: documentModels,
      targetPath,
    });
  }
  updateFolder(document: Document): void {}

  updateFile(document: Document): void {
    const currentPath = this.getCurrentPath();
    //    this.#filemanagerStore.uploadFile({ document, currentPath });
  }

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
    return this.#breadcrumbStore.currentPath()?.key;
  }
}

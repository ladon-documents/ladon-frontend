import { Injectable, inject } from '@angular/core';
import { PdfViewerStore } from '../store/pdf-viewer.store';
import { LadonRouterService } from '../services/ladon-router.service';
import { DocumentModel } from '@ladon/api';

@Injectable({ providedIn: 'root' })
export class PdfViewerFacade {
  private readonly store = inject(PdfViewerStore);
  private readonly router = inject(LadonRouterService);

  readonly selectedDocument = this.store.selectedDocument;
  readonly isLoading = this.store.isLoading;
  readonly hasError = this.store.hasError;
  readonly errorMessage = this.store.errorMessage;
  readonly loadingProgress = this.store.loadingProgress;
  readonly currentPage = this.store.currentPage;
  readonly totalPages = this.store.totalPages;
  readonly zoomLevel = this.store.zoomLevel;
  readonly showToolbar = this.store.showToolbar;
  readonly showSidebar = this.store.showSidebar;
  readonly isFullscreen = this.store.isFullscreen;
  readonly isPresentationMode = this.store.isPresentationMode;
  readonly rotation = this.store.rotation;
  readonly darkMode = this.store.darkMode;
  readonly pdfUrl = this.store.pdfUrl;
  readonly isPdfReady = this.store.isPdfReady;
  readonly canNavigateBackward = this.store.canNavigateBackward;
  readonly canNavigateForward = this.store.canNavigateForward;
  readonly canZoomIn = this.store.canZoomIn;
  readonly canZoomOut = this.store.canZoomOut;
  readonly documentDisplayName = this.store.documentDisplayName;
  readonly currentState = this.store.currentState;

  setDocument = this.store.setDocument;
  loadDocument = this.store.loadPDFDocument;

  previousPage = this.store.previousPage;
  nextPage = this.store.nextPage;
  goToPage = this.store.setCurrentPage;
  goToFirstPage = this.store.goToFirstPage;
  goToLastPage = this.store.goToLastPage;

  zoomIn = this.store.zoomIn;
  zoomOut = this.store.zoomOut;
  resetZoom = this.store.resetZoom;
  setZoomLevel = this.store.setZoomLevel;
  fitToWidth = this.store.fitToWidth;

  toggleToolbar = this.store.toggleToolbar;
  toggleSidebar = this.store.toggleSidebar;
  toggleFullscreen = this.store.toggleFullscreen;
  togglePresentationMode = this.store.togglePresentationMode;
  toggleDarkMode = this.store.toggleDarkMode;

  rotateClockwise = this.store.rotateClockwise;
  rotateCounterClockwise = this.store.rotateCounterClockwise;
  resetRotation = this.store.resetRotation;

  onPdfLoaded = this.store.onPdfLoaded;
  onLoadingProgress = this.store.setLoadingProgress;
  onError = this.store.setError;
  clearError = this.store.clearError;

  resetState = this.store.resetState;
  resetToInitialState = this.store.resetToInitialState;

  async navigateToPdfViewer(documuent: DocumentModel) {
    this.setDocument(documuent);
    await this.router.navigateToPdfViewer(documuent.path);
  }
}

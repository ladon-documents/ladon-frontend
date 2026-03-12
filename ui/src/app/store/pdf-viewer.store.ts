import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY, of, delay } from 'rxjs';
import { DocumentModel } from '../../api';
import { isPdfDocument } from '@utility';

interface PdfViewerState {
  selectedDocument: DocumentModel | null;
  queryParams: Record<string, string | number | boolean>;

  isLoading: boolean;
  hasError: boolean;
  errorMessage: string;
  loadingProgress: number;

  currentPage: number;
  totalPages: number;

  zoomLevel: number;
  showToolbar: boolean;
  showSidebar: boolean;

  isFullscreen: boolean;
  isPresentationMode: boolean;
  rotation: number; // 0, 90, 180, 270

  renderingProgress: number;

  fitToWidth: boolean;
  darkMode: boolean;

  isDownloading: boolean;
  isPrinting: boolean;
}

const initialState: PdfViewerState = {
  selectedDocument: null,
  queryParams: {},

  isLoading: false,
  hasError: false,
  errorMessage: '',
  loadingProgress: 0,

  currentPage: 1,
  totalPages: 0,

  zoomLevel: 100,
  showToolbar: true,
  showSidebar: false,

  isFullscreen: false,
  isPresentationMode: false,
  rotation: 0,

  renderingProgress: 0,

  fitToWidth: false,
  darkMode: false,

  isDownloading: false,
  isPrinting: false,
};

export const PdfViewerStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setDocument: (document: DocumentModel | null): void => {
      if (!document) {
        patchState(store, {
          ...initialState,
          selectedDocument: null,
        });
        return;
      }

      if (!isPdfDocument(document)) {
        patchState(store, {
          ...initialState,
          hasError: true,
          isLoading: false,
          errorMessage: 'Das ausgewählte Dokument ist keine PDF-Datei',
        });
        return;
      }

      patchState(store, {
        selectedDocument: document,
        isLoading: true,
        hasError: false,
        errorMessage: '',
        currentPage: 1,
        totalPages: 0,
        loadingProgress: 0,
        rotation: 0,
      });
    },

    setLoadingState: (isLoading: boolean, progress: number = 0): void => {
      patchState(store, {
        isLoading,
        loadingProgress: progress,
      });
    },

    setLoadingProgress: (progress: number): void => {
      patchState(store, {
        loadingProgress: Math.max(0, Math.min(100, progress)),
      });
    },

    setError: (error: string): void => {
      patchState(store, {
        hasError: true,
        errorMessage: error,
        isLoading: false,
        loadingProgress: 0,
      });
    },

    clearError: (): void => {
      patchState(store, {
        isLoading: false,
        hasError: false,
        errorMessage: '',
      });
    },

    onPdfLoaded: (totalPages: number): void => {
      patchState(store, {
        isLoading: false,
        hasError: false,
        errorMessage: '',
        totalPages,
        loadingProgress: 100,
      });
    },

    setCurrentPage: (page: number): void => {
      const currentTotal = store.totalPages();
      if (page >= 1 && page <= currentTotal) {
        patchState(store, { currentPage: page });
      }
    },

    previousPage: (): void => {
      const current = store.currentPage();
      if (current > 1) {
        patchState(store, { currentPage: current - 1 });
      }
    },

    nextPage: (): void => {
      const current = store.currentPage();
      const total = store.totalPages();
      if (current < total) {
        patchState(store, { currentPage: current + 1 });
      }
    },

    goToFirstPage: (): void => {
      patchState(store, { currentPage: 1 });
    },

    goToLastPage: (): void => {
      const total = store.totalPages();
      if (total > 0) {
        patchState(store, { currentPage: total });
      }
    },

    setZoomLevel: (zoomLevel: number): void => {
      const clampedZoom = Math.max(25, Math.min(300, zoomLevel));
      patchState(store, { zoomLevel: clampedZoom });
    },

    zoomIn: (step: number = 25): void => {
      const current = store.zoomLevel();
      const newZoom = Math.min(300, current + step);
      patchState(store, { zoomLevel: newZoom });
    },

    zoomOut: (step: number = 25): void => {
      const current = store.zoomLevel();
      const newZoom = Math.max(25, current - step);
      patchState(store, { zoomLevel: newZoom });
    },

    resetZoom: (): void => {
      patchState(store, { zoomLevel: 100 });
    },

    fitToWidth: (): void => {
      patchState(store, {
        fitToWidth: true,
        zoomLevel: 100,
      });
    },

    toggleToolbar: (): void => {
      patchState(store, {
        showToolbar: !store.showToolbar(),
      });
    },

    setToolbarVisible: (visible: boolean): void => {
      patchState(store, { showToolbar: visible });
    },

    toggleSidebar: (): void => {
      patchState(store, {
        showSidebar: !store.showSidebar(),
      });
    },

    setSidebarVisible: (visible: boolean): void => {
      patchState(store, { showSidebar: visible });
    },

    setFullscreen: (isFullscreen: boolean): void => {
      patchState(store, { isFullscreen });
    },

    toggleFullscreen: (): void => {
      patchState(store, {
        isFullscreen: !store.isFullscreen(),
      });
    },

    setPresentationMode: (isPresentationMode: boolean): void => {
      patchState(store, {
        isPresentationMode,
        showToolbar: !isPresentationMode,
        showSidebar: false,
      });
    },

    togglePresentationMode: (): void => {
      const current = store.isPresentationMode();
      patchState(store, {
        isPresentationMode: !current,
        showToolbar: current,
        showSidebar: false,
      });
    },

    rotateClockwise: (): void => {
      const current = store.rotation();
      const newRotation = (current + 90) % 360;
      patchState(store, { rotation: newRotation });
    },

    rotateCounterClockwise: (): void => {
      const current = store.rotation();
      const newRotation = (current - 90 + 360) % 360;
      patchState(store, { rotation: newRotation });
    },

    resetRotation: (): void => {
      patchState(store, { rotation: 0 });
    },

    setDarkMode: (darkMode: boolean): void => {
      patchState(store, { darkMode });
    },

    toggleDarkMode: (): void => {
      patchState(store, { darkMode: !store.darkMode() });
    },

    setFitToWidth: (fitToWidth: boolean): void => {
      patchState(store, { fitToWidth });
    },

    setDownloading: (isDownloading: boolean): void => {
      patchState(store, { isDownloading });
    },

    setPrinting: (isPrinting: boolean): void => {
      patchState(store, { isPrinting });
    },

    resetState: (): void => {
      patchState(store, {
        hasError: false,
        isLoading: false,
        errorMessage: '',
        currentPage: 1,
        totalPages: 0,
        loadingProgress: 0,
        rotation: 0,
        renderingProgress: 0,
      });
    },

    resetToInitialState: (): void => {
      patchState(store, initialState);
    },

    updateDisplaySettings: (
      settings: Partial<Pick<PdfViewerState, 'showToolbar' | 'showSidebar' | 'zoomLevel' | 'darkMode' | 'fitToWidth'>>,
    ): void => {
      patchState(store, settings);
    },

    updateNavigationState: (page: number, totalPages?: number): void => {
      const updates: Partial<PdfViewerState> = { currentPage: page };
      if (totalPages !== undefined) {
        updates.totalPages = totalPages;
      }
      patchState(store, updates);
    },

    loadPDFDocument: rxMethod<DocumentModel | null>(
      pipe(
        tap((document) => {
          if (!document) {
            patchState(store, initialState);
            return;
          }
          if (!isPdfDocument(document)) {
            patchState(store, {
              hasError: true,
              errorMessage: 'Das ausgewählte Dokument ist keine PDF-Datei',
              isLoading: false,
              loadingProgress: 0,
            });
            return;
          }
          patchState(store, {
            selectedDocument: document,
            isLoading: true,
            hasError: false,
            errorMessage: '',
            currentPage: 1,
            totalPages: 0,
            loadingProgress: 0,
            rotation: 0,
          });
        }),
        switchMap((document) => {
          if (!document || !isPdfDocument(document)) {
            return EMPTY;
          }
          return of(document).pipe(
            delay(100),
            tap(() => patchState(store, { loadingProgress: 50 })),
            delay(100),
            tap(() => patchState(store, { loadingProgress: 100 })),
            catchError((error) => {
              patchState(store, {
                hasError: true,
                errorMessage: `Fehler beim Laden der PDF: ${error.message}`,
                isLoading: false,
                loadingProgress: 0,
              });
              return EMPTY;
            }),
          );
        }),
      ),
    ),
  })),
  withComputed((store) => ({
    pdfUrl: computed(() => {
      const doc = store.selectedDocument();
      if (!doc || !doc.bucket || !doc.key) return '';
      return `/admin/api/filemanager/${encodeURIComponent(doc.bucket)}/direct?id=${encodeURIComponent(doc.key)}`;
    }),

    // Document Ready Check
    isPdfReady: computed(() => !store.isLoading() && !store.hasError() && store.selectedDocument() !== null),

    // Navigation State
    canNavigateBackward: computed(() => store.currentPage() > 1),
    canNavigateForward: computed(() => store.currentPage() < store.totalPages()),

    // Zoom State
    canZoomIn: computed(() => store.zoomLevel() < 300),
    canZoomOut: computed(() => store.zoomLevel() > 25),

    // Document Information
    documentDisplayName: computed(() => {
      const doc = store.selectedDocument();
      if (!doc) return 'Dokument';
      return doc.name || doc.key || 'Unbekanntes Dokument';
    }),

    // Progress Information
    isActivelyLoading: computed(
      () => store.isLoading() || (store.loadingProgress() > 0 && store.loadingProgress() < 100),
    ),

    // Current State Summary
    currentState: computed(() => ({
      document: store.selectedDocument(),
      page: store.currentPage(),
      totalPages: store.totalPages(),
      zoom: store.zoomLevel(),
      isLoading: store.isLoading(),
      hasError: store.hasError(),
      rotation: store.rotation(),
      isFullscreen: store.isFullscreen(),
    })),
  })),
);

export type { PdfViewerState };

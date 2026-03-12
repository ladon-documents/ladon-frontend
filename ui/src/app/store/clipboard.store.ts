import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { DocumentModel } from '../../api';
import { isPdfDocument } from '@utility';
import { ConverterService } from '../services/converter.service';

interface ClipboardState {
  selectedDocuments: DocumentModel[];
  isClipboardOpen: boolean;
  lastAction: 'copy' | 'move' | 'merge-pdf' | 'create-zip' | null;
  actionInProgress: boolean;
  error: string | null;
  lastMergedPdfUrl: string | null;
}

const initialState: ClipboardState = {
  selectedDocuments: [],
  isClipboardOpen: false,
  lastAction: null,
  actionInProgress: false,
  error: null,
  lastMergedPdfUrl: null,
};

export const ClipboardStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  withComputed((store) => ({
    documentCount: computed(() => store.selectedDocuments().length),

    hasDocuments: computed(() => store.selectedDocuments().length > 0),

    isEmpty: computed(() => store.selectedDocuments().length === 0),

    allDocumentsArePdf: computed(
      () =>
        store.selectedDocuments().length > 0 &&
        store.selectedDocuments().every((doc) => isPdfDocument(doc)),
    ),

    canGeneratePdf: computed(
      () =>
        store.selectedDocuments().length >= 2 &&
        store.selectedDocuments().every((doc) => isPdfDocument(doc)),
    ),

    canCreateZip: computed(() => store.selectedDocuments().length > 0),

    canShare: computed(() => store.selectedDocuments().length > 0),

    canDownload: computed(() => store.selectedDocuments().length > 0),

    totalSize: computed(() => store.selectedDocuments().reduce((sum, doc) => sum + (doc.size || 0), 0)),

    onlyFolders: computed(
      () => store.selectedDocuments().length > 0 && store.selectedDocuments().every((doc) => doc.isFolder === true),
    ),

    onlyFiles: computed(
      () => store.selectedDocuments().length > 0 && store.selectedDocuments().every((doc) => !doc.isFolder),
    ),

    hasMixedContent: computed(() => {
      const docs = store.selectedDocuments();
      const hasFolders = docs.some((doc) => doc.isFolder === true);
      const hasFiles = docs.some((doc) => !doc.isFolder);
      return hasFolders && hasFiles;
    }),

    hasError: computed(() => store.error() !== null),

    documentPaths: computed(() =>
      store
        .selectedDocuments()
        .filter((doc) => doc.path)
        .map((doc) => doc.path as string),
    ),
  })),

  withMethods((store, converterService = inject(ConverterService)) => ({
    addDocument: (document: DocumentModel) => {
      const exists = store.selectedDocuments().some((doc) => doc.key === document.key);
      if (!exists) {
        patchState(store, {
          selectedDocuments: [...store.selectedDocuments(), document],
          lastAction: 'copy',
          error: null,
        });
      }
    },

    addDocuments: (documents: DocumentModel[]) => {
      const existingKeys = new Set(store.selectedDocuments().map((doc) => doc.key));
      const newDocs = documents.filter((doc) => !existingKeys.has(doc.key));

      if (newDocs.length > 0) {
        patchState(store, {
          selectedDocuments: [...store.selectedDocuments(), ...newDocs],
          lastAction: 'copy',
          error: null,
        });
      }
    },

    removeDocument: (documentKey: string) => {
      patchState(store, {
        selectedDocuments: store.selectedDocuments().filter((doc) => doc.key !== documentKey),
      });
    },

    removeDocumentByIndex: (index: number) => {
      const documents = [...store.selectedDocuments()];
      documents.splice(index, 1);
      patchState(store, { selectedDocuments: documents });
    },

    reorderDocuments: (fromIndex: number, toIndex: number) => {
      const documents = [...store.selectedDocuments()];
      const [movedDoc] = documents.splice(fromIndex, 1);
      documents.splice(toIndex, 0, movedDoc);
      patchState(store, { selectedDocuments: documents });
    },

    clearDocuments: () => {
      patchState(store, {
        selectedDocuments: [],
        lastAction: null,
        error: null,
        lastMergedPdfUrl: null,
      });
    },

    toggleClipboard: () => {
      patchState(store, {
        isClipboardOpen: !store.isClipboardOpen(),
      });
    },

    openClipboard: () => {
      patchState(store, { isClipboardOpen: true });
    },

    closeClipboard: () => {
      patchState(store, { isClipboardOpen: false });
    },

    hasDocument: (documentKey: string): boolean => {
      return store.selectedDocuments().some((doc) => doc.key === documentKey);
    },

    setActionInProgress: (inProgress: boolean) => {
      patchState(store, { actionInProgress: inProgress });
    },

    setLastAction: (action: 'copy' | 'move' | 'merge-pdf' | 'create-zip' | null) => {
      patchState(store, { lastAction: action });
    },

    setError: (error: string | null) => {
      patchState(store, { error });
    },

    clearError: () => {
      patchState(store, { error: null });
    },

    mergePdfs: rxMethod<void>(
      pipe(
        tap(() => {
          patchState(store, {
            actionInProgress: true,
            error: null,
            lastAction: 'merge-pdf',
          });
        }),
        switchMap(() => {
          const paths = store.documentPaths();

          if (paths.length < 2) {
            patchState(store, {
              error: 'Mindestens 2 PDF-Dokumente sind erforderlich',
              actionInProgress: false,
            });
            return EMPTY;
          }

          if (!store.canGeneratePdf()) {
            patchState(store, {
              error: 'Alle ausgewählten Dokumente müssen PDFs sein',
              actionInProgress: false,
            });
            return EMPTY;
          }

          const filesJson = JSON.stringify(paths);

          return new Promise<void>((resolve, reject) => {
            converterService
              .mergePdf(filesJson)
              .then(() => {
                patchState(store, {
                  actionInProgress: false,
                  error: null,
                  selectedDocuments: [],
                });
                resolve();
              })
              .catch((error) => {
                patchState(store, {
                  actionInProgress: false,
                  error: error.message || 'Fehler beim Zusammenführen der PDFs',
                });
                reject(error);
              });
          });
        }),
        catchError((error) => {
          patchState(store, {
            actionInProgress: false,
            error: error.message || 'Ein unerwarteter Fehler ist aufgetreten',
          });
          return EMPTY;
        }),
      ),
    ),

    createZip: rxMethod<void>(
      pipe(
        tap(() => {
          patchState(store, {
            actionInProgress: true,
            error: null,
            lastAction: 'create-zip',
          });
        }),
        switchMap(() => {
          const paths = store.documentPaths();

          if (paths.length === 0) {
            patchState(store, {
              error: 'Keine Dokumente zum Zippen ausgewählt',
              actionInProgress: false,
            });
            return EMPTY;
          }

          const filesJson = JSON.stringify(paths);

          return new Promise<void>((resolve, reject) => {
            converterService
              .downloadAsZip(filesJson)
              .then(() => {
                patchState(store, {
                  actionInProgress: false,
                  error: null,
                  selectedDocuments: [],
                });
                resolve();
              })
              .catch((error) => {
                patchState(store, {
                  actionInProgress: false,
                  error: error.message || 'Fehler beim Erstllen der Zip Datei',
                });
                reject(error);
              });
          });
        }),
        catchError((error) => {
          patchState(store, {
            actionInProgress: false,
            error: error.message || 'Fehler beim Erstellen des ZIP-Archivs',
          });
          return EMPTY;
        }),
      ),
    ),

    reset: () => {
      patchState(store, initialState);
    },
  })),
);

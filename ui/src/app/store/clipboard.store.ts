import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { withEntities, addEntity, removeEntity, setAllEntities, updateEntity } from '@ngrx/signals/entities';
import { DocumentModel } from '../../api';

interface ClipboardState {
  selectedDocuments: DocumentModel[];
  isClipboardOpen: boolean;
  lastAction: 'copy' | 'move' | null;
  actionInProgress: boolean;
}

const initialState: ClipboardState = {
  selectedDocuments: [],
  isClipboardOpen: false,
  lastAction: null,
  actionInProgress: false,
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
        store
          .selectedDocuments()
          .every(
            (doc) => doc.key?.toLowerCase().endsWith('.pdf'),
          ),
    ),
    canGeneratePdf: computed(
      () =>
        store.selectedDocuments().length > 0 &&
        store
          .selectedDocuments()
          .every(
            (doc) => doc.key?.toLowerCase().endsWith('.pdf'),
          ),
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
  })),

  withMethods((store) => ({
    addDocument: (document: DocumentModel) => {
      const exists = store.selectedDocuments().some((doc) => doc.key === document.key);
      if (!exists) {
        patchState(store, {
          selectedDocuments: [...store.selectedDocuments(), document],
          lastAction: 'copy',
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

    setLastAction: (action: 'copy' | 'move' | null) => {
      patchState(store, { lastAction: action });
    },
    reset: () => {
      patchState(store, initialState);
    },
  })),
);

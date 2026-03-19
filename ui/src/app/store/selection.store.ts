import { computed, Injectable } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { DocumentModel } from '@ladon/api';

interface SelectionState {
  selectedDocuments: DocumentModel[];
  lastSelectedIndex: number | null;
  selectionMode: boolean;
}

const initialState: SelectionState = {
  selectedDocuments: [],
  lastSelectedIndex: null,
  selectionMode: false,
};

const documentId = (document: DocumentModel): string =>
  `${document.bucket || ''}::${document.key || document.path || document.name || ''}`;

const isSameDocument = (left: DocumentModel, right: DocumentModel): boolean => documentId(left) === documentId(right);

@Injectable({ providedIn: 'root' })
export class SelectionStore extends signalStore(
  withState(initialState),
  withComputed((state) => ({
    selectedCount: computed(() => state.selectedDocuments().length),
    hasSelection: computed(() => state.selectedDocuments().length > 0),
  })),
  withMethods((store) => ({
    isSelected(document: DocumentModel): boolean {
      return store.selectedDocuments().some((doc) => isSameDocument(doc, document));
    },

    selectSingle(document: DocumentModel, index: number) {
      patchState(store, {
        selectedDocuments: [document],
        lastSelectedIndex: index,
        selectionMode: true,
      });
    },

    toggleSelection(document: DocumentModel, index: number) {
      const selected = store.selectedDocuments();
      const isCurrentlySelected = selected.some((doc) => isSameDocument(doc, document));
      const nextSelection = isCurrentlySelected
        ? selected.filter((doc) => !isSameDocument(doc, document))
        : [...selected, document];

      patchState(store, {
        selectedDocuments: nextSelection,
        lastSelectedIndex: index,
        selectionMode: nextSelection.length > 0,
      });
    },

    selectRange(documents: DocumentModel[], index: number) {
      if (!documents.length) {
        return;
      }

      const anchorIndex = store.lastSelectedIndex();
      if (anchorIndex === null) {
        const document = documents[index];
        if (!document) {
          return;
        }

        patchState(store, {
          selectedDocuments: [document],
          lastSelectedIndex: index,
          selectionMode: true,
        });
        return;
      }

      if (anchorIndex < 0 || anchorIndex >= documents.length) {
        const document = documents[index];
        if (!document) {
          return;
        }

        patchState(store, {
          selectedDocuments: [document],
          lastSelectedIndex: index,
          selectionMode: true,
        });
        return;
      }

      const start = Math.max(0, Math.min(anchorIndex, index));
      const end = Math.min(documents.length - 1, Math.max(anchorIndex, index));
      const rangeSelection = documents.slice(start, end + 1);

      patchState(store, {
        selectedDocuments: rangeSelection,
        selectionMode: rangeSelection.length > 0,
      });
    },

    selectAll(documents: DocumentModel[]) {
      patchState(store, {
        selectedDocuments: documents,
        lastSelectedIndex: documents.length > 0 ? documents.length - 1 : null,
        selectionMode: documents.length > 0,
      });
    },

    clearSelection() {
      patchState(store, { selectedDocuments: [], lastSelectedIndex: null, selectionMode: false });
    },

    setSelectionMode(mode: boolean) {
      patchState(store, { selectionMode: mode });
    },
  })),
) {}

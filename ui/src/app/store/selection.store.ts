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

@Injectable({ providedIn: 'root' })
export class SelectionStore extends signalStore(
  withState(initialState),
  withComputed((state) => ({
    selectedCount: computed(() => state.selectedDocuments().length),
    hasSelection: computed(() => state.selectedDocuments().length > 0),
  })),
  withMethods((store) => ({
    isSelected(document: DocumentModel): boolean {
      return store.selectedDocuments().some((doc) => doc.bucket === document.bucket && doc.key === document.key);
    },
    toggleSelection(document: DocumentModel, index: number, shiftKey: boolean = false) {
      const selected = store.selectedDocuments();
      const isCurrentlySelected = selected.some((doc) => doc.bucket === document.bucket && doc.key === document.key);

      if (shiftKey && store.lastSelectedIndex() !== null) {
        // Range selection logic will be implemented here
        console.log('Range selection from', store.lastSelectedIndex(), 'to', index);
      } else if (isCurrentlySelected) {
        patchState(store, {
          selectedDocuments: selected.filter((doc) => !(doc.bucket === document.bucket && doc.key === document.key)),
          lastSelectedIndex: index,
        });
      } else {
        patchState(store, {
          selectedDocuments: [...selected, document],
          lastSelectedIndex: index,
        });
      }
    },
    selectAll(documents: DocumentModel[]) {
      patchState(store, { selectedDocuments: documents });
    },
    clearSelection() {
      patchState(store, { selectedDocuments: [], lastSelectedIndex: null });
    },
    setSelectionMode(mode: boolean) {
      patchState(store, { selectionMode: mode });
    },
  })),
) {}

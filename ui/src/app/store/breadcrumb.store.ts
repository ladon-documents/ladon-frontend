import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { DocumentModel } from '../../api';

export interface BreadcrumbState {
  paths: DocumentModel[];
  currentPath: DocumentModel | null;
}

const initialState: BreadcrumbState = {
  paths: [],
  currentPath: null,
};

export const BreadcrumbStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    addPath(path: DocumentModel) {
      patchState(store, (state) => ({
        paths: [...state.paths, path],
        currentPath: path,
      }));
    },

    navigateToIndex(index: number) {
      patchState(store, (state) => ({
        paths: state.paths.slice(0, index),
        currentPath: state.paths[index],
      }));
      return store.currentPath();

    },
    root() {
      patchState(store, initialState);
    },
    reset() {
      patchState(store, initialState);
    },
  })),
);

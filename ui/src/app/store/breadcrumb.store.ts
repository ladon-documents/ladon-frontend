import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Document } from '@ladon/api';

export interface BreadcrumbState {
  paths: Document[];
  currentPath: Document | null;
}

const initialState: BreadcrumbState = {
  paths: [],
  currentPath: null,
};

export const BreadcrumbStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    addPath(path: Document) {
      const currentPaths = store.paths();
      const existingIndex = currentPaths.findIndex((item) => item.key === path.key && item.bucket === path.bucket);

      if (existingIndex >= 0) {
        patchState(store, {
          paths: currentPaths.slice(0, existingIndex + 1),
          currentPath: currentPaths[existingIndex],
        });
        return;
      }

      patchState(store, (state) => ({
        paths: [...state.paths, path],
        currentPath: path,
      }));
    },

    navigateToIndex(index: number) {
      const paths = store.paths();
      if (index < 0 || index >= paths.length) {
        return store.currentPath();
      }

      patchState(store, (state) => ({
        paths: state.paths.slice(0, index + 1),
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

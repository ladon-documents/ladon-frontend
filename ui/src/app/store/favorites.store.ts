import { computed, Injectable } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { DocumentModel } from '../../api';

interface FavoritesState {
  favorites: DocumentModel[];
}

const initialState: FavoritesState = {
  favorites: [],
};

@Injectable({ providedIn: 'root' })
export class FavoritesStore extends signalStore(
  withState(initialState),
  withComputed((state) => ({
    favoriteCount: computed(() => state.favorites().length),
  })),
  withMethods((store) => ({
    isFavorite(document: DocumentModel): boolean {
      return store.favorites().some((fav) => fav.bucket === document.bucket && fav.key === document.key);
    },
    addFavorite(document: DocumentModel) {
      const favorites = store.favorites();
      const exists = favorites.some((fav) => fav.bucket === document.bucket && fav.key === document.key);
      if (!exists) {
        const newFavorites = [...favorites, document];
        patchState(store, { favorites: newFavorites });
        this.saveFavorites(newFavorites);
      }
    },
    removeFavorite(document: DocumentModel) {
      const favorites = store
        .favorites()
        .filter((fav) => !(fav.bucket === document.bucket && fav.key === document.key));
      patchState(store, { favorites });
      this.saveFavorites(favorites);
    },
    toggleFavorite(document: DocumentModel) {
      const isFav = store.favorites().some((fav) => fav.bucket === document.bucket && fav.key === document.key);
      if (isFav) {
        this.removeFavorite(document);
      } else {
        this.addFavorite(document);
      }
    },
    loadFavorites() {
      const stored = localStorage.getItem('ladon-favorites');
      if (stored) {
        try {
          const favorites = JSON.parse(stored);
          patchState(store, { favorites });
        } catch (e) {
          console.error('Failed to load favorites', e);
        }
      }
    },
    saveFavorites(favorites: DocumentModel[]) {
      localStorage.setItem('ladon-favorites', JSON.stringify(favorites));
    },
  })),
) {
  constructor() {
    super();
    this.loadFavorites();
  }
}

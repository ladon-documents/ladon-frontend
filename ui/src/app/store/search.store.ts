import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { BucketUiItemModel } from '@ladon/api';

export interface SearchItem {
  id: string;
  name: string;
  size?: number;
  favourite?: boolean;
  type: 'bucket';
  searchedAt: Date;
}

export interface RecentSearch {
  term: string;
  searchedAt: Date;
  resultCount: number;
}

export interface SearchState {
  searchTerm: string;
  isLoading: boolean;
  searchResults: SearchItem[];
  recentSearches: RecentSearch[];
  selectedIndex: number;
  error: string | null;
  lastSearchTime: Date | null;
}

const initialState: SearchState = {
  searchTerm: '',
  isLoading: false,
  searchResults: [],
  recentSearches: [],
  selectedIndex: -1,
  error: null,
  lastSearchTime: null,
};

export const SearchStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    hasResults: computed(() => store.searchResults().length > 0),
    showNoResults: computed(
      () => !store.isLoading() && store.searchTerm().length > 0 && store.searchResults().length === 0,
    ),
    showEmptyState: computed(() => !store.searchTerm() && store.searchResults().length === 0),
    showRecentSearches: computed(() => !store.searchTerm() && store.recentSearches().length > 0),
    topRecentSearches: computed(() =>
      store
        .recentSearches()
        .sort((a, b) => new Date(b.searchedAt).getTime() - new Date(a.searchedAt).getTime())
        .slice(0, 5),
    ),
  })),
  withMethods((store) => ({
    setSearchTerm: (term: string) => {
      patchState(store, {
        searchTerm: term,
        selectedIndex: -1,
        error: null,
      });
    },

    setLoading: (loading: boolean) => {
      patchState(store, { isLoading: loading });
    },

    setSearchResults: (results: BucketUiItemModel[]) => {
      const searchItems: SearchItem[] = results.map((bucket) => ({
        id: bucket.id || '',
        name: bucket.id || '',
        size: bucket.size,
        favourite: bucket.favourite,
        type: 'bucket' as const,
        searchedAt: new Date(),
      }));

      patchState(store, {
        searchResults: searchItems,
        isLoading: false,
        lastSearchTime: new Date(),
        error: null,
      });
    },

    setError: (error: string) => {
      patchState(store, {
        error,
        isLoading: false,
        searchResults: [],
      });
    },

    setSelectedIndex: (index: number) => {
      const maxIndex = store.searchResults().length - 1;
      const clampedIndex = Math.max(-1, Math.min(index, maxIndex));
      patchState(store, { selectedIndex: clampedIndex });
    },

    incrementSelectedIndex: () => {
      const current = store.selectedIndex();
      const maxIndex = store.searchResults().length - 1;
      const newIndex = Math.min(current + 1, maxIndex);
      patchState(store, { selectedIndex: newIndex });
    },

    decrementSelectedIndex: () => {
      const current = store.selectedIndex();
      const newIndex = Math.max(current - 1, -1);
      patchState(store, { selectedIndex: newIndex });
    },

    addRecentSearch: (term: string, resultCount: number) => {
      if (!term.trim()) return;

      const currentRecentSearches = store.recentSearches();

      // Entferne existierende Suche mit dem gleichen Begriff
      const filteredSearches = currentRecentSearches.filter(
        (search) => search.term.toLowerCase() !== term.toLowerCase(),
      );

      const newRecentSearch: RecentSearch = {
        term: term.trim(),
        searchedAt: new Date(),
        resultCount,
      };

      const updatedRecentSearches = [newRecentSearch, ...filteredSearches].slice(0, 10);

      patchState(store, { recentSearches: updatedRecentSearches });

      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('search_recent_searches', JSON.stringify(updatedRecentSearches));
        } catch (error) {
          console.warn('Fehler beim Speichern der Recent Searches:', error);
        }
      }
    },

    loadRecentSearches: () => {
      if (typeof localStorage === 'undefined') return;

      try {
        const stored = localStorage.getItem('search_recent_searches');
        if (stored) {
          const recentSearches: RecentSearch[] = JSON.parse(stored).map((item: any) => ({
            ...item,
            searchedAt: new Date(item.searchedAt),
          }));
          patchState(store, { recentSearches });
        }
      } catch (error) {
        console.warn('Fehler beim Laden der Recent Searches:', error);
      }
    },

    clearRecentSearches: () => {
      patchState(store, { recentSearches: [] });
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.removeItem('search_recent_searches');
        } catch (error) {
          console.warn('Fehler beim Löschen der Recent Searches:', error);
        }
      }
    },

    removeRecentSearch: (term: string) => {
      const currentRecentSearches = store.recentSearches();
      const filtered = currentRecentSearches.filter((search) => search.term !== term);
      patchState(store, { recentSearches: filtered });

      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('search_recent_searches', JSON.stringify(filtered));
        } catch (error) {
          console.warn('Fehler beim Aktualisieren der Recent Searches:', error);
        }
      }
    },

    clearSearch: () => {
      patchState(store, {
        searchTerm: '',
        searchResults: [],
        selectedIndex: -1,
        error: null,
        isLoading: false,
      });
    },

    reset: () => {
      patchState(store, initialState);
    },
  })),
);

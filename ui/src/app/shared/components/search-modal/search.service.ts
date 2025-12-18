import { Injectable, inject, DestroyRef } from '@angular/core';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, filter, takeUntil } from 'rxjs';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchStore } from '../../../store/search.store';
import { BucketsFacade } from '../../../buckets/buckets.facade';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly searchStore = inject(SearchStore);
  private readonly bucketsFacade = inject(BucketsFacade);
  private readonly destroyRef = inject(DestroyRef);

  // Convert signals to observables in injection context
  private readonly searchTerm$ = toObservable(this.searchStore.searchTerm);
  private readonly buckets$ = toObservable(this.bucketsFacade.buckets);

  constructor() {
    // Lade Recent Searches beim Start
    this.searchStore.loadRecentSearches();

    // Reagiere auf Suchbegriff-Änderungen
    this.searchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(term => typeof term === 'string'), // Sicherheitscheck
      switchMap(term => this.performSearch(term)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  private performSearch(term: string) {
    if (!term.trim()) {
      this.searchStore.clearSearch();
      return of([]);
    }

    this.searchStore.setLoading(true);

    // Nutze die bestehende BucketsFacade für die Suche
    this.bucketsFacade.setRemoteSearchTerm(term);

    return this.buckets$.pipe(
      debounceTime(100), // Kurze Debounce um auf Facade-Updates zu warten
      switchMap(buckets => {
        this.searchStore.setSearchResults(buckets);
        this.searchStore.addRecentSearch(term, buckets.length);
        return of(buckets);
      }),
      catchError(error => {
        this.searchStore.setError('Fehler bei der Suche');
        console.error('Search error:', error);
        return of([]);
      })
    );
  }

  // Public API
  search(term: string) {
    this.searchStore.setSearchTerm(term);
  }

  selectResult(index: number) {
    const results = this.searchStore.searchResults();
    if (index >= 0 && index < results.length) {
      return results[index];
    }
    return null;
  }

  selectFromRecentSearch(term: string) {
    this.search(term);
  }

  // Store Selectors
  readonly searchTerm = this.searchStore.searchTerm;
  readonly isLoading = this.searchStore.isLoading;
  readonly searchResults = this.searchStore.searchResults;
  readonly selectedIndex = this.searchStore.selectedIndex;
  readonly hasResults = this.searchStore.hasResults;
  readonly showNoResults = this.searchStore.showNoResults;
  readonly showEmptyState = this.searchStore.showEmptyState;
  readonly showRecentSearches = this.searchStore.showRecentSearches;
  readonly recentSearches = this.searchStore.topRecentSearches;
  readonly error = this.searchStore.error;

  // Store Methods
  readonly setSelectedIndex = this.searchStore.setSelectedIndex;
  readonly incrementSelectedIndex = this.searchStore.incrementSelectedIndex;
  readonly decrementSelectedIndex = this.searchStore.decrementSelectedIndex;
  readonly clearSearch = this.searchStore.clearSearch;
  readonly clearRecentSearches = this.searchStore.clearRecentSearches;
  readonly removeRecentSearch = this.searchStore.removeRecentSearch;
}

import { Component, ElementRef, ViewChild, inject, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService } from './search.service';
import { BucketsFacade } from '../../../buckets/buckets.facade';

@Component({
  selector: 'app-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: 'search-modal.component.html',
  styleUrls: ['./search-modal.component.scss'],
})
export class SearchModalComponent {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  // Signal Inputs
  isOpen = input<boolean>(false);
  placeholder = input<string>('Buckets durchsuchen...');

  // Signal Outputs
  close = output<void>();
  bucketSelected = output<any>();

  private readonly searchService = inject(SearchService);
  private readonly bucketsFacade = inject(BucketsFacade);

  // Search Service Selectors
  readonly searchTerm = this.searchService.searchTerm;
  readonly isLoading = this.searchService.isLoading;
  readonly searchResults = this.searchService.searchResults;
  readonly selectedIndex = this.searchService.selectedIndex;
  readonly hasResults = this.searchService.hasResults;
  readonly showNoResults = this.searchService.showNoResults;
  readonly showEmptyState = this.searchService.showEmptyState;
  readonly showRecentSearches = this.searchService.showRecentSearches;
  readonly recentSearches = this.searchService.recentSearches;
  readonly error = this.searchService.error;

  constructor() {
    // Effect für Focus-Management
    effect(() => {
      if (this.isOpen()) {
        setTimeout(() => {
          this.searchInput?.nativeElement?.focus();
        }, 100);
      }
    });

    this.setupKeyboardNavigation();
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchService.search(target.value);
  }

  selectBucket(bucketId: string) {
    // Finde das Bucket in der Facade
    const buckets = this.bucketsFacade.buckets();
    const bucket = buckets.find((b) => b.id === bucketId);

    if (bucket) {
      this.bucketsFacade.selectBucket(bucket);
      this.bucketSelected.emit(bucket);
    }

    this.closeModal();
  }

  selectFromRecentSearch(term: string) {
    this.searchService.selectFromRecentSearch(term);
    // Setze Focus zurück auf Input
    setTimeout(() => {
      this.searchInput?.nativeElement?.focus();
    }, 50);
  }

  removeRecentSearch(event: Event, term: string) {
    event.stopPropagation();
    this.searchService.removeRecentSearch(term);
  }

  clearRecentSearches() {
    this.searchService.clearRecentSearches();
  }

  closeModal() {
    this.searchService.clearSearch();
    this.close.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  private setupKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
      if (!this.isOpen()) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          this.closeModal();
          break;

        case 'ArrowDown':
          event.preventDefault();
          this.searchService.incrementSelectedIndex();
          break;

        case 'ArrowUp':
          event.preventDefault();
          this.searchService.decrementSelectedIndex();
          break;

        case 'Enter':
          event.preventDefault();
          const currentIndex = this.selectedIndex();
          const result = this.searchService.selectResult(currentIndex);
          if (result) {
            this.selectBucket(result.id);
          }
          break;
      }
    });
  }
}

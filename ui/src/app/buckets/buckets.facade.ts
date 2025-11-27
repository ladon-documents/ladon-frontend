import { Injectable, inject, computed } from '@angular/core';
import { BucketsStore } from '../store/bucket.store';

@Injectable({
  providedIn: 'root',
})
export class BucketsFacade {
  private readonly store = inject(BucketsStore);

  readonly buckets = this.store.buckets;
  readonly selectedBucket = this.store.selectedBucket;
  readonly bucketStats = this.store.bucketStats;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;
  readonly searchTerm = this.store.searchTerm;
  readonly showFavoritesOnly = this.store.showFavoritesOnly;
  readonly sortConfig = this.store.sort;
  readonly pagination = this.store.pagination;

  readonly hasBuckets = computed(() => this.buckets().length > 0);
  readonly hasSelectedBucket = computed(() => !!this.selectedBucket());

  loadBuckets() {
    this.store.loadBuckets();
  }

  selectBucket(bucket: any) {
    this.store.setSelectedBucket(bucket);
  }

  setSearchTerm(searchTerm: string) {
    this.store.setSearchTerm(searchTerm);
  }

  clearSearch() {
    this.store.clearSearch();
  }

  toggleFavoritesFilter(showFavoritesOnly: boolean) {
    this.store.toggleFavoritesFilter(showFavoritesOnly);
  }

  toggleBucketFavorite(bucketId: string) {
    this.store.toggleBucketFavorite(bucketId);
  }

  setSortConfig(field: 'id' | 'size' | 'created' | 'createdBy' | 'favourite' |'createdDate', direction?: 'asc' | 'desc') {
    this.store.setSortConfig(field, direction);
  }

  toggleSort(field: 'id' | 'size' | 'created' | 'createdBy' | 'favourite' | 'createdDate') {
    this.store.setSortConfig(field);
  }

  setPageSize(pageSize: number) {
    this.store.setPageSize(pageSize);
  }

  goToPage(page: number) {
    this.store.goToPage(page);
  }

  nextPage() {
    this.store.nextPage();
  }

  previousPage() {
    this.store.previousPage();
  }

  firstPage() {
    this.store.firstPage();
  }

  lastPage() {
    this.store.lastPage();
  }

  createBucket(bucketName: string) {
    this.store.createBucket(bucketName);
  }

  deleteBucket(bucketId: string) {
    this.store.deleteBucket(bucketId);
  }

  resetStore() {
    this.store.resetBucketsStore();
  }
}

import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, debounceTime, EMPTY, pipe, switchMap, tap } from 'rxjs';
import { BucketsService } from '../buckets/buckets.service';
import { BucketUiItemModel } from '../../api';

export interface BucketStats {
  name: string;
  size: string;
  folderCount: number;
  fileCount: number;
  favourite: boolean;
  lastModified?: Date;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SortConfig {
  field: 'id' | 'size' | 'created' | 'createdDate' | 'favourite' | 'createdBy';
  direction: 'asc' | 'desc';
}

export interface BucketsState {
  buckets: BucketUiItemModel[];
  allBuckets: BucketUiItemModel[];
  filteredBuckets: BucketUiItemModel[];
  selectedBucket: BucketUiItemModel | null;
  bucketStats: BucketStats | null;
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  remoteSearchTerm: string;
  showFavoritesOnly: boolean;
  sort: SortConfig;
  pagination: PaginationState;
}

const initialState: BucketsState = {
  buckets: [],
  allBuckets: [],
  filteredBuckets: [],
  selectedBucket: null,
  bucketStats: null,
  isLoading: false,
  error: null,
  searchTerm: '',
  remoteSearchTerm: '',
  showFavoritesOnly: false,
  sort: {
    field: 'created',
    direction: 'desc',
  },
  pagination: {
    currentPage: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

export const BucketsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, bucketsService = inject(BucketsService)) => {
    const methods = {
      resetBucketsStore() {
        patchState(store, initialState);
      },

      setSelectedBucket: (selectedBucket: BucketUiItemModel | null) => {
        patchState(store, { selectedBucket });
        if (selectedBucket && selectedBucket.id) {
          methods.loadBucketStats(selectedBucket.id);
        } else {
          patchState(store, { bucketStats: null });
        }
      },

      setSearchTerm: (searchTerm: string) => {
        const { filteredBuckets, paginatedBuckets, paginationState } = methods.applyFiltersAndPagination(
          store.allBuckets(),
          searchTerm,
          store.showFavoritesOnly(),
          store.sort(),
          1,
          store.pagination().pageSize,
        );

        patchState(store, {
          searchTerm,
          filteredBuckets,
          buckets: paginatedBuckets,
          pagination: paginationState,
        });
      },

      setRemoteSearchTerm: (searchTerm: string) => {
        methods.searchBucket(searchTerm);
      },

      clearSearch: () => {
        methods.setSearchTerm('');
      },

      clearRemoteSearch: () => {
        methods.loadBuckets();
      },

      toggleFavoritesFilter: (showFavoritesOnly: boolean) => {
        const { filteredBuckets, paginatedBuckets, paginationState } = methods.applyFiltersAndPagination(
          store.allBuckets(),
          store.searchTerm(),
          showFavoritesOnly,
          store.sort(),
          1,
          store.pagination().pageSize,
        );

        patchState(store, {
          showFavoritesOnly,
          filteredBuckets,
          buckets: paginatedBuckets,
          pagination: paginationState,
        });
      },

      setSortConfig: (field: SortConfig['field'], direction?: SortConfig['direction']) => {
        const newDirection =
          direction || (store.sort().field === field && store.sort().direction === 'asc' ? 'desc' : 'asc');

        const newSortConfig: SortConfig = { field, direction: newDirection };

        const { filteredBuckets, paginatedBuckets, paginationState } = methods.applyFiltersAndPagination(
          store.allBuckets(),
          store.searchTerm(),
          store.showFavoritesOnly(),
          newSortConfig,
          1,
          store.pagination().pageSize,
        );

        patchState(store, {
          sort: newSortConfig,
          filteredBuckets,
          buckets: paginatedBuckets,
          pagination: paginationState,
        });
      },

      setPageSize: (pageSize: number) => {
        const { filteredBuckets, paginatedBuckets, paginationState } = methods.applyFiltersAndPagination(
          store.allBuckets(),
          store.searchTerm(),
          store.showFavoritesOnly(),
          store.sort(),
          1,
          pageSize,
        );

        patchState(store, {
          filteredBuckets,
          buckets: paginatedBuckets,
          pagination: paginationState,
        });
      },

      goToPage: (page: number) => {
        const targetPage = Math.max(1, Math.min(page, store.pagination().totalPages));

        const { paginatedBuckets, paginationState } = methods.calculatePaginationState(
          store.filteredBuckets(),
          targetPage,
          store.pagination().pageSize,
        );

        patchState(store, {
          buckets: paginatedBuckets,
          pagination: paginationState,
        });
      },

      nextPage: () => {
        const currentPagination = store.pagination();
        if (currentPagination.hasNextPage) {
          methods.goToPage(currentPagination.currentPage + 1);
        }
      },

      previousPage: () => {
        const currentPagination = store.pagination();
        if (currentPagination.hasPreviousPage) {
          methods.goToPage(currentPagination.currentPage - 1);
        }
      },

      firstPage: () => {
        methods.goToPage(1);
      },

      lastPage: () => {
        const currentPagination = store.pagination();
        methods.goToPage(currentPagination.totalPages);
      },
      applyFilters: (
        buckets: BucketUiItemModel[],
        searchTerm: string,
        showFavoritesOnly: boolean,
      ): BucketUiItemModel[] => {
        let filtered = [...buckets];
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filtered = filtered.filter((bucket) => bucket.id?.toLowerCase().includes(term));
        }
        if (showFavoritesOnly) {
          filtered = filtered.filter((bucket) => bucket.favourite);
        }

        return filtered;
      },

      sortBuckets: (buckets: BucketUiItemModel[], sortConfig: SortConfig): BucketUiItemModel[] => {
        return [...buckets].sort((a, b) => {
          let aValue: any;
          let bValue: any;

          switch (sortConfig.field) {
            case 'size':
              aValue = a.size || '';
              bValue = b.size || '';
              break;
            case 'created':
              aValue = a.created;
              bValue = b.created;
              break;
            case 'createdDate':
              aValue = a.createdDate || a.created;
              bValue = b.createdDate || b.created;
              break;
            case 'favourite':
              aValue = a.favourite ? 1 : 0;
              bValue = b.favourite ? 1 : 0;
              break;
            default:
              aValue = a.id;
              bValue = b.id;
          }

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.localeCompare(bValue);
            return sortConfig.direction === 'asc' ? comparison : -comparison;
          }

          if (aValue instanceof Date && bValue instanceof Date) {
            const comparison = aValue.getTime() - bValue.getTime();
            return sortConfig.direction === 'asc' ? comparison : -comparison;
          }

          if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        });
      },

      calculatePaginationState: (
        allBuckets: BucketUiItemModel[],
        currentPage: number,
        pageSize: number,
      ): {
        paginatedBuckets: BucketUiItemModel[];
        paginationState: PaginationState;
      } => {
        const totalItems = allBuckets.length;
        const totalPages = Math.ceil(totalItems / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalItems);

        const paginatedBuckets = allBuckets.slice(startIndex, endIndex);

        const paginationState: PaginationState = {
          currentPage,
          pageSize,
          totalItems,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        };

        return { paginatedBuckets, paginationState };
      },

      applyFiltersAndPagination: (
        allBuckets: BucketUiItemModel[],
        searchTerm: string,
        showFavoritesOnly: boolean,
        sortConfig: SortConfig,
        currentPage: number,
        pageSize: number,
      ) => {
        const filteredBuckets = methods.applyFilters(allBuckets, searchTerm, showFavoritesOnly);
        const sortedBuckets = methods.sortBuckets(filteredBuckets, sortConfig);
        const { paginatedBuckets, paginationState } = methods.calculatePaginationState(
          sortedBuckets,
          currentPage,
          pageSize,
        );

        return {
          filteredBuckets: sortedBuckets,
          paginatedBuckets,
          paginationState,
        };
      },

      toggleBucketFavorite: (bucketId: string) => {
        const buckets = store.allBuckets().map((bucket) => {
          if (bucket.id === bucketId) {
            return { ...bucket, favourite: !bucket.favourite };
          }
          return bucket;
        });

        const { filteredBuckets, paginatedBuckets, paginationState } = methods.applyFiltersAndPagination(
          buckets,
          store.searchTerm(),
          store.showFavoritesOnly(),
          store.sort(),
          store.pagination().currentPage,
          store.pagination().pageSize,
        );

        patchState(store, {
          allBuckets: buckets,
          filteredBuckets,
          buckets: paginatedBuckets,
          pagination: paginationState,
        });

        const selectedBucket = store.selectedBucket();
        if (selectedBucket && selectedBucket.id === bucketId) {
          const updatedSelected = buckets.find((b) => b.id === bucketId);
          if (updatedSelected) {
            patchState(store, { selectedBucket: updatedSelected });
          }
        }
      },

      loadBuckets: rxMethod<void>(
        pipe(
          tap(() => {
            patchState(store, { isLoading: true, error: null });
          }),
          switchMap(() =>
            bucketsService.getBuckets().pipe(
              tap((buckets) => {
                const { filteredBuckets, paginatedBuckets, paginationState } = methods.applyFiltersAndPagination(
                  buckets,
                  store.searchTerm(),
                  store.showFavoritesOnly(),
                  store.sort(),
                  1,
                  store.pagination().pageSize,
                );

                patchState(store, {
                  isLoading: false,
                  allBuckets: buckets,
                  filteredBuckets,
                  buckets: paginatedBuckets,
                  pagination: paginationState,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
                  error: error.error?.reason || 'Fehler beim Laden der Buckets',
                });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      searchBucket: rxMethod<string>(
        pipe(
          tap(() => {
            patchState(store, { isLoading: true, error: null });
          }),
          debounceTime(100),
          switchMap((bucketToSearch) =>
            bucketsService.searchBuckets(bucketToSearch).pipe(
              tap((buckets) => {
                const { filteredBuckets, paginatedBuckets, paginationState } = methods.applyFiltersAndPagination(
                  buckets,
                  store.searchTerm(),
                  store.showFavoritesOnly(),
                  store.sort(),
                  1,
                  store.pagination().pageSize,
                );

                patchState(store, {
                  isLoading: false,
                  allBuckets: buckets,
                  filteredBuckets,
                  buckets: paginatedBuckets,
                  pagination: paginationState,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
                  error: error.error?.reason || 'Fehler beim Laden der Buckets',
                });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      loadBucketStats: rxMethod<string>(
        pipe(
          tap(() => {
            patchState(store, { isLoading: true });
          }),

          switchMap((bucket) =>
            bucketsService.getStats(bucket).pipe(
              switchMap(async (stats) => {
                const response = JSON.parse(await stats.text());
                return response;
              }),
              tap((stats: any) => {
                patchState(store, {
                  isLoading: false,
                  bucketStats: stats,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
                  error: error.error?.reason || 'Fehler beim Laden der Bucket-Statistiken',
                });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      createBucket: rxMethod<string>(
        pipe(
          tap(() => {
            patchState(store, { isLoading: true, error: null });
          }),
          switchMap((bucketName) =>
            bucketsService.createBucket(bucketName).pipe(
              tap(() => {
                methods.loadBuckets();
              }),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
                  error: error.error?.reason || 'Fehler beim Erstellen des Buckets',
                });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      deleteBucket: rxMethod<string>(
        pipe(
          tap(() => {
            patchState(store, { isLoading: true, error: null });
          }),
          switchMap((bucketId) =>
            bucketsService.deleteBucket(bucketId).pipe(
              tap(() => {
                const selectedBucket = store.selectedBucket();
                if (selectedBucket && selectedBucket.id === bucketId) {
                  patchState(store, { selectedBucket: null, bucketStats: null });
                }
                methods.loadBuckets();
              }),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
                  error: error.error?.reason || 'Fehler beim Löschen des Buckets',
                });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
    };
    return methods;
  }),
);

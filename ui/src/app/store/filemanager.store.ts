import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { DocumentModel } from '../../api';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs';
import { FilemanagerService } from '../filemanager/filemanager.service';
import { BucketStatsExtended } from '../interfaces/bucket-stats';
import { LadonRouterService } from '../services/ladon-router.service';
import { BreadcrumbStore } from './breadcrumb.store';
import { filemanagerHelper } from '../filemanager/helper/helper';

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SortConfig {
  field: keyof DocumentModel | 'name' | 'size' | 'type';
  direction: 'asc' | 'desc';
}

type ViewMode = 'card' | 'table';

export interface FilemanagerState {
  documents: DocumentModel[];
  allDocuments: DocumentModel[];
  filteredDocuments: DocumentModel[];
  statistics: BucketStatsExtended | null;
  selectedDocument: DocumentModel | null;
  isLoading: boolean;
  error: string | null;
  sort: SortConfig;
  pagination: PaginationState;
  searchTerm: string;
  selectedBucket: string | null;
  viewMode: ViewMode;
}

const initialState: FilemanagerState = {
  documents: [],
  allDocuments: [],
  filteredDocuments: [],
  statistics: null,
  selectedDocument: null,
  selectedBucket: null,
  isLoading: false,
  error: null,
  sort: {
    field: 'last-modified',
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
  searchTerm: '',
  viewMode: 'card',
};

export const FilemanagerStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods(
    (
      store,
      filemanagerService = inject(FilemanagerService),
      ladonRouter = inject(LadonRouterService),
      breadcrumbStore = inject(BreadcrumbStore),
    ) => {
      const methods = {
        showRoot() {
          methods.loadBucket(store.selectedBucket());
        },
        resetFilemanagerStore() {
          patchState(store, initialState);
        },
        navigateToFilemanagerWithBucket: async (selectedBucket: string) => {
          patchState(store, (state) => ({
            ...state,
            selectedBucket,
          }));
          await ladonRouter.navigateToFilemanagerWithBucket(selectedBucket);
        },
        updateSelectedBucket: (selectedBucket: string) => {
          patchState(store, { selectedBucket });
        },
        setSelectedDocument: (selectedDocument: DocumentModel | null) => {
          patchState(store, { selectedDocument });
        },
        setViewMode: (viewMode: ViewMode) => {
          patchState(store, { viewMode });
        },

        setSearchTerm: (searchTerm: string) => {
          const { filteredDocuments, paginatedDocuments, paginationState } =
            filemanagerHelper.applyFiltersAndPagination(
              store.allDocuments(),
              searchTerm,
              store.sort(),
              1,
              store.pagination().pageSize,
            );

          patchState(store, {
            searchTerm,
            filteredDocuments,
            documents: paginatedDocuments,
            pagination: paginationState,
          });
        },

        clearSearch: () => {
          methods.setSearchTerm('');
        },

        setSortConfig: (field: SortConfig['field'], direction?: SortConfig['direction']) => {
          const newDirection =
            direction || (store.sort().field === field && store.sort().direction === 'asc' ? 'desc' : 'asc');

          const newSortConfig: SortConfig = { field, direction: newDirection };

          const { filteredDocuments, paginatedDocuments, paginationState } =
            filemanagerHelper.applyFiltersAndPagination(
              store.allDocuments(),
              store.searchTerm(),
              newSortConfig,
              1,
              store.pagination().pageSize,
            );

          patchState(store, {
            sort: newSortConfig,
            filteredDocuments,
            documents: paginatedDocuments,
            pagination: paginationState,
          });
        },

        setPageSize: (pageSize: number) => {
          const { filteredDocuments, paginatedDocuments, paginationState } =
            filemanagerHelper.applyFiltersAndPagination(
              store.allDocuments(),
              store.searchTerm(),
              store.sort(),
              1,
              pageSize,
            );

          patchState(store, {
            filteredDocuments,
            documents: paginatedDocuments,
            pagination: paginationState,
          });
        },

        goToPage: (page: number) => {
          const targetPage = Math.max(1, Math.min(page, store.pagination().totalPages));

          const { paginatedDocuments, paginationState } = filemanagerHelper.calculatePaginationState(
            store.filteredDocuments(),
            targetPage,
            store.pagination().pageSize,
          );

          patchState(store, {
            documents: paginatedDocuments,
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

        loadStats: rxMethod<any>(
          pipe(
            tap(() => {
              patchState(store, { isLoading: true });
            }),
            switchMap((bucket) =>
              filemanagerService.getStats(bucket).pipe(
                switchMap(async (stats) => {
                  const response = JSON.parse(await stats.text());
                  return response;
                }),
                tap((response) => {
                  patchState(store, (state) => ({
                    ...state,
                    isLoading: false,
                    statistics: response,
                  }));
                }),
                catchError((error) => {
                  patchState(store, (state) => ({
                    ...state,
                    isLoading: false,
                    error,
                  }));
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        loadBucket: rxMethod<any>(
          pipe(
            tap(() => {
              patchState(store, (state) => ({
                ...initialState,
                isLoading: true,
                viewMode: state.viewMode,
                pagination: { ...state.pagination },
              }));
            }),
            switchMap((bucket) =>
              filemanagerService.loadBucket(bucket, 1000).pipe(
                tap((documents) => {
                  const { filteredDocuments, paginatedDocuments, paginationState } =
                    filemanagerHelper.applyFiltersAndPagination(
                      documents,
                      store.searchTerm(),
                      store.sort(),
                      1,
                      store.pagination().pageSize,
                    );

                  patchState(store, (state) => ({
                    ...state,
                    selectedBucket: bucket,
                    isLoading: false,
                    allDocuments: documents,
                    filteredDocuments,
                    selectedDocument: documents[0],
                    documents: paginatedDocuments,
                    pagination: paginationState,
                  }));
                }),
                catchError((error) => {
                  patchState(store, (state) => ({
                    ...state,
                    isLoading: false,
                    error: error.error?.reason,
                  }));
                  throw error;
                }),
              ),
            ),
          ),
        ),

        loadDocumentList: rxMethod<any>(
          pipe(
            tap(() => {
              patchState(store, (state) => ({
                ...state,
                error: null,
                isLoading: true,
              }));
            }),
            switchMap((document) =>
              filemanagerService.loadDocumentList(document).pipe(
                tap((documents) => {
                  if (document) {
                    breadcrumbStore.addPath(document);
                  }
                  const { filteredDocuments, paginatedDocuments, paginationState } =
                    filemanagerHelper.applyFiltersAndPagination(
                      documents,
                      store.searchTerm(),
                      store.sort(),
                      1,
                      store.pagination().pageSize,
                    );

                  patchState(store, (state) => ({
                    ...state,
                    isLoading: false,
                    allDocuments: documents,
                    filteredDocuments,
                    selectedDocument: documents[0],
                    documents: paginatedDocuments,
                    pagination: paginationState,
                  }));
                }),
                catchError((error) => {
                  patchState(store, (state) => ({
                    ...state,
                    isLoading: false,
                    error,
                  }));
                  throw error;
                }),
              ),
            ),
          ),
        ),
        createFolder: rxMethod<{ folderName: string; currentPath?: string }>(
          pipe(
            tap(() => {
              patchState(store, (state) => ({
                ...state,
                isLoading: true,
                error: null,
              }));
            }),
            switchMap(({ folderName, currentPath }) => {
              const bucket = store.selectedBucket();
              if (!bucket) {
                throw new Error('Kein Bucket ausgewählt');
              }
              const folderPath = currentPath
                ? `${currentPath.endsWith('/') ? currentPath : currentPath + '/'}${folderName}/`
                : `${folderName}/`;
              return filemanagerService.createNewFolder(bucket, folderPath).pipe(
                switchMap(() => {
                  if (currentPath) {
                    const currentDocument: DocumentModel = {
                      path: currentPath,
                      bucket: store.selectedBucket() ?? undefined,
                      key: currentPath,
                    };
                    return filemanagerService.loadDocumentList(currentDocument);
                  } else {
                    return filemanagerService.loadBucket(bucket);
                  }
                }),
                tap((documents) => {
                  const { filteredDocuments, paginatedDocuments, paginationState } =
                    filemanagerHelper.applyFiltersAndPagination(
                      documents,
                      store.searchTerm(),
                      store.sort(),
                      store.pagination().currentPage,
                      store.pagination().pageSize,
                    );

                  patchState(store, (state) => ({
                    ...state,
                    isLoading: false,
                    allDocuments: documents,
                    filteredDocuments,
                    documents: paginatedDocuments,
                    pagination: paginationState,
                    error: null,
                  }));
                }),
                catchError((error) => {
                  patchState(store, (state) => ({
                    ...state,
                    isLoading: false,
                    error: `Fehler beim Erstellen des Ordners: ${error.message || error}`,
                  }));
                  throw error;
                }),
              );
            }),
          ),
        ),
        uploadFile: rxMethod<{ folderName: string; currentPath?: string, content: any }>(
          pipe(
            tap(() => {
              patchState(store, (state) => ({
                ...state,
                isLoading: true,
                error: null,
              }));
            }),
            switchMap(({ folderName, currentPath, content }) => {
              const bucket = store.selectedBucket();
              if (!bucket) {
                throw new Error('Kein Bucket ausgewählt');
              }
              const folderPath = currentPath
                ? `${currentPath.endsWith('/') ? currentPath : currentPath + '/'}${folderName}/`
                : `${folderName}/`;
              return filemanagerService.createNewFile(bucket, folderPath, content).pipe(
                switchMap(() => {
                  if (currentPath) {
                    const currentDocument: DocumentModel = {
                      path: currentPath,
                      bucket: store.selectedBucket() ?? undefined,
                      key: currentPath,
                    };
                    return filemanagerService.loadDocumentList(currentDocument);
                  } else {
                    return filemanagerService.loadBucket(bucket);
                  }
                }),
                tap((documents) => {
                  const { filteredDocuments, paginatedDocuments, paginationState } =
                    filemanagerHelper.applyFiltersAndPagination(
                      documents,
                      store.searchTerm(),
                      store.sort(),
                      store.pagination().currentPage,
                      store.pagination().pageSize,
                    );

                  patchState(store, (state) => ({
                    ...state,
                    isLoading: false,
                    allDocuments: documents,
                    filteredDocuments,
                    documents: paginatedDocuments,
                    pagination: paginationState,
                    error: null,
                  }));
                }),
                catchError((error) => {
                  patchState(store, (state) => ({
                    ...state,
                    isLoading: false,
                    error: `Fehler beim Erstellen des Ordners: ${error.message || error}`,
                  }));
                  throw error;
                }),
              );
            }),
          ),
        ),
      };
      return methods;
    },
  ),
);

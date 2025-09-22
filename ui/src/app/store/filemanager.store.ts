import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { DocumentModel } from '../../api';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs';
import { FilemanagerService } from '../filemanager/filemanager.service';
import { BucketStatsExtended } from '../interfaces/bucket-stats';
import { LadonRouterService } from '../services/ladon-router.service';
import { BreadcrumbStore } from './breadcrumb.store';

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface SortConfig {
  field: keyof DocumentModel;
  direction: 'asc' | 'desc';
}

interface DocumentPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
}

interface FilterState {
  searchTerm: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  filters: {
    category: string[];
    status: string[];
    dateRange: { start: Date; end: Date };
  };
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
  };
}

interface NotificationState {
  notifications: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isRead: boolean;
    timestamp: Date;
  }>;
  unreadCount: number;
  isNotificationPanelOpen: boolean;
}

type ViewMode = 'card' | 'table';


interface FilemanagerState {
  documents: DocumentModel[];
  allDocuments: DocumentModel[]; // Alle geladenen Dokumente für Client-seitige Pagination
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

function calculatePaginationState(
  allDocuments: DocumentModel[],
  currentPage: number,
  pageSize: number
): {
  paginatedDocuments: DocumentModel[],
  paginationState: PaginationState
} {
  const totalItems = allDocuments.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedDocuments = allDocuments.slice(startIndex, endIndex);

  const paginationState: PaginationState = {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };

  return { paginatedDocuments, paginationState };
}


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
      const methods =
        {
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
        setPageSize: (pageSize: number) => {
          const { paginatedDocuments, paginationState } = calculatePaginationState(
            store.allDocuments(),
            1, // Reset to first page when changing page size
            pageSize
          );

          patchState(store, {
            documents: paginatedDocuments,
            pagination: paginationState,
          });
        },
        goToPage: (page: number) => {
          const currentPagination = store.pagination();
          const targetPage = Math.max(1, Math.min(page, currentPagination.totalPages));

          const { paginatedDocuments, paginationState } = calculatePaginationState(
            store.allDocuments(),
            targetPage,
            currentPagination.pageSize
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
                viewMode: state.viewMode, // Preserve view mode
                pagination: { ...state.pagination }, // Preserve pagination settings

              }));
            }),
            switchMap((bucket) =>
              filemanagerService.loadBucket(bucket, 1000).pipe(
                tap((documents) => {
                  const currentPagination = store.pagination();
                  const { paginatedDocuments, paginationState } = calculatePaginationState(
                    documents,
                    1, // Reset to first page
                    currentPagination.pageSize
                  );


                  patchState(store, (state) => ({
                    ...state,
                    selectedBucket: bucket,
                    isLoading: false,
                    allDocuments: documents,
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

                  const currentPagination = store.pagination();
                  const { paginatedDocuments, paginationState } = calculatePaginationState(
                    documents,
                    1, // Reset to first page when navigating to new folder
                    currentPagination.pageSize
                  );

                  patchState(store, (state) => ({
                    ...state,
                    isLoading: false,
                    allDocuments: documents,
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
                    const currentDocument: DocumentModel = { path: currentPath };
                    return filemanagerService.loadDocumentList(currentDocument);
                  } else {
                    return filemanagerService.loadBucket(bucket);
                  }
                }),
                tap((documents) => {
                  patchState(store, (state) => ({
                    ...state,
                    isLoading: false,
                    documents,
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

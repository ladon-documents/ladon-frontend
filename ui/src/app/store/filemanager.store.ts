import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { DocumentModel } from '@ladon/api';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, forkJoin, pipe, switchMap, tap } from 'rxjs';
import { FilemanagerService } from '../filemanager/filemanager.service';
import { BucketStatsExtended } from '../interfaces/bucket-stats';
import { LadonRouterService } from '../services/ladon-router.service';
import { BreadcrumbStore } from './breadcrumb.store';
import { filemanagerHelper } from '../filemanager/helper/helper';
import { buildTargetPath } from '@ladon/utility';
import { ToastService } from '../shared/services/toast.service';
import { ConfirmationDialogService } from '../shared/services/confirmation-dialog.service';
import { ClipboardStore } from './clipboard.store';

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
  currentFolder: DocumentModel | null;
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
  currentFolder: null,
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
      toastService = inject(ToastService),
      confirmationDialog = inject(ConfirmationDialogService),
      clipboardStore = inject(ClipboardStore),
    ) => {
      const reloadCurrentList = () => {
        const currentFolder = store.currentFolder();
        if (currentFolder?.bucket && currentFolder.key) {
          return filemanagerService.loadDocumentList(currentFolder);
        }

        const bucket = store.selectedBucket();
        if (bucket) {
          return filemanagerService.loadBucket(bucket);
        }

        return EMPTY;
      };

      const resolveLoadDocumentListInput = (
        input: DocumentModel | { document: DocumentModel; updateBreadcrumb?: boolean },
      ) => {
        if ('document' in input) {
          return {
            document: input.document,
            updateBreadcrumb: input.updateBreadcrumb ?? true,
          };
        }

        return {
          document: input,
          updateBreadcrumb: true,
        };
      };

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
                  breadcrumbStore.reset();
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
                    currentFolder: null,
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
        loadDocumentList: rxMethod<DocumentModel | { document: DocumentModel; updateBreadcrumb?: boolean }>(
          pipe(
            tap(() => {
              patchState(store, (state) => ({
                ...state,
                error: null,
                isLoading: true,
              }));
            }),
            switchMap((input) => {
              const { document, updateBreadcrumb } = resolveLoadDocumentListInput(input);
              return filemanagerService.loadDocumentList(document).pipe(
                tap((documents) => {
                  if (updateBreadcrumb && document) {
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
                    currentFolder: document,
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
              );
            }),
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
                switchMap(() => reloadCurrentList()),
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
        createFile: rxMethod<{ fileName: string; currentPath?: string }>(
          pipe(
            tap(() => {
              patchState(store, (state) => ({
                ...state,
                isLoading: true,
                error: null,
              }));
            }),
            switchMap(({ fileName, currentPath }) => {
              const bucket = store.selectedBucket();
              if (!bucket) {
                throw new Error('Kein Bucket ausgewählt');
              }
              const folderPath = currentPath
                ? `${currentPath.endsWith('/') ? currentPath : currentPath + '/'}${fileName}`
                : `${fileName}`;
              return filemanagerService.createNewFile(bucket, folderPath, null).pipe(
                switchMap(() => reloadCurrentList()),
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
                    error: `Fehler beim Erstellen einer neuen Datei: ${error.message || error}`,
                  }));
                  throw error;
                }),
              );
            }),
          ),
        ),
        uploadFile: rxMethod<{ folderName: string; currentPath?: string; content: any }>(
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
              return filemanagerService.createNewFile(bucket, folderPath, null).pipe(
                switchMap(() => reloadCurrentList()),
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
        deleteDocument: rxMethod<DocumentModel>(
          pipe(
            switchMap(async (document) => {
              const confirmed = await confirmationDialog.confirm({
                title: document.isFolder ? 'Ordner löschen' : 'Datei löschen',
                message: document.isFolder
                  ? `Möchten Sie den Ordner "${document.name}" wirklich löschen? Alle enthaltenen Dateien werden ebenfalls gelöscht.`
                  : `Möchten Sie die Datei "${document.name}" wirklich löschen?`,
                confirmText: 'Löschen',
                cancelText: 'Abbrechen',
                danger: true,
              });

              return { document, confirmed };
            }),
            switchMap((result) => {
              if (!result.confirmed) {
                return EMPTY;
              }

              const document = result.document;
              patchState(store, { isLoading: true, error: null });

              return filemanagerService.deleteDocument(document).pipe(
                switchMap(() => reloadCurrentList()),
                tap((documents) => {
                  const { filteredDocuments, paginatedDocuments, paginationState } =
                    filemanagerHelper.applyFiltersAndPagination(
                      documents,
                      store.searchTerm(),
                      store.sort(),
                      store.pagination().currentPage,
                      store.pagination().pageSize,
                    );

                  patchState(store, {
                    isLoading: false,
                    allDocuments: documents,
                    filteredDocuments,
                    documents: paginatedDocuments,
                    pagination: paginationState,
                    error: null,
                  });

                  toastService.success(
                    document.isFolder
                      ? `Ordner "${document.name}" wurde erfolgreich gelöscht`
                      : `Datei "${document.name}" wurde erfolgreich gelöscht`,
                  );
                }),
                catchError((error) => {
                  patchState(store, {
                    isLoading: false,
                    error: `Fehler beim Löschen: ${error.message || error}`,
                  });

                  toastService.error(
                    `Fehler beim Löschen von "${document.name}": ${error.message || 'Unbekannter Fehler'}`,
                  );

                  return EMPTY;
                }),
              );
            }),
          ),
        ),
        deleteDocuments: rxMethod<DocumentModel[]>(
          pipe(
            switchMap(async (documents) => {
              const validDocuments = documents.filter(
                (document) => !!document.bucket && !!document.key,
              ) as Array<DocumentModel & { key: string; bucket: string }>;

              if (validDocuments.length === 0) {
                return { documents: validDocuments, confirmed: false };
              }

              const hasFolders = validDocuments.some((document) => document.isFolder);
              const confirmed = await confirmationDialog.confirm({
                title: `${validDocuments.length} Element(e) löschen`,
                message: hasFolders
                  ? `Möchten Sie ${validDocuments.length} Elemente wirklich löschen? Enthaltene Dateien in Ordnern werden ebenfalls gelöscht.`
                  : `Möchten Sie ${validDocuments.length} Dateien wirklich löschen?`,
                confirmText: 'Löschen',
                cancelText: 'Abbrechen',
                danger: true,
              });

              return { documents: validDocuments, confirmed };
            }),
            switchMap((result) => {
              if (!result.confirmed || result.documents.length === 0) {
                return EMPTY;
              }

              patchState(store, { isLoading: true, error: null });

              const deleteRequests = result.documents.map((document) => filemanagerService.deleteDocument(document));

              return forkJoin(deleteRequests).pipe(
                switchMap(() => reloadCurrentList()),
                tap((documents) => {
                  const { filteredDocuments, paginatedDocuments, paginationState } =
                    filemanagerHelper.applyFiltersAndPagination(
                      documents,
                      store.searchTerm(),
                      store.sort(),
                      store.pagination().currentPage,
                      store.pagination().pageSize,
                    );

                  patchState(store, {
                    isLoading: false,
                    allDocuments: documents,
                    filteredDocuments,
                    documents: paginatedDocuments,
                    pagination: paginationState,
                    error: null,
                  });

                  toastService.success(`${result.documents.length} Dokument(e) wurden erfolgreich gelöscht`);
                }),
                catchError((error) => {
                  patchState(store, {
                    isLoading: false,
                    error: `Fehler beim Löschen: ${error.message || error}`,
                  });

                  toastService.error(`Fehler beim Löschen: ${error.message || 'Unbekannter Fehler'}`);

                  return EMPTY;
                }),
              );
            }),
          ),
        ),
        moveDocument: rxMethod<{ document: DocumentModel; targetPath: string }>(
          pipe(
            tap(() => {
              patchState(store, { isLoading: true, error: null });
            }),
            switchMap(({ document, targetPath }) => {
              const targetBucket = store.selectedBucket();
              if (!targetBucket || !document.bucket || !document.key) {
                throw new Error('Fehlende Parameter für Verschieben');
              }

              const targetKey = buildTargetPath(targetPath, document.key);

              return filemanagerService.moveDocument(document, targetBucket, targetKey).pipe(
                switchMap(() => reloadCurrentList()),
                tap((documents) => {
                  const { filteredDocuments, paginatedDocuments, paginationState } =
                    filemanagerHelper.applyFiltersAndPagination(
                      documents,
                      store.searchTerm(),
                      store.sort(),
                      store.pagination().currentPage,
                      store.pagination().pageSize,
                    );

                  patchState(store, {
                    isLoading: false,
                    allDocuments: documents,
                    filteredDocuments,
                    documents: paginatedDocuments,
                    pagination: paginationState,
                    error: null,
                  });
                  if (document.key) {
                    clipboardStore.removeDocument(document.key);
                  }
                  toastService.success(`"${document.name}" wurde erfolgreich verschoben`);
                }),
                catchError((error) => {
                  patchState(store, {
                    isLoading: false,
                    error: `Fehler beim Verschieben: ${error.message || error}`,
                  });
                  toastService.error(`Fehler beim Verschieben: ${error.message || 'Unbekannter Fehler'}`);
                  return EMPTY;
                }),
              );
            }),
          ),
        ),
        moveDocuments: rxMethod<{ documents: DocumentModel[]; targetPath: string }>(
          pipe(
            tap(() => {
              patchState(store, { isLoading: true, error: null });
            }),
            switchMap(({ documents: documentsToMove, targetPath }) => {
              const targetBucket = store.selectedBucket();
              const validDocuments = documentsToMove.filter(
                (document) => !!document.bucket && !!document.key,
              ) as Array<DocumentModel & { key: string; bucket: string }>;

              if (!targetBucket || validDocuments.length === 0) {
                patchState(store, {
                  isLoading: false,
                  error: 'Fehlende Parameter für Verschieben',
                });
                return EMPTY;
              }

              const moveRequests = validDocuments.map((document) =>
                filemanagerService.moveDocument(document, targetBucket, buildTargetPath(targetPath, document.key)),
              );

              return forkJoin(moveRequests).pipe(
                switchMap(() => reloadCurrentList()),
                tap((documents) => {
                  const { filteredDocuments, paginatedDocuments, paginationState } =
                    filemanagerHelper.applyFiltersAndPagination(
                      documents,
                      store.searchTerm(),
                      store.sort(),
                      store.pagination().currentPage,
                      store.pagination().pageSize,
                    );

                  patchState(store, {
                    isLoading: false,
                    allDocuments: documents,
                    filteredDocuments,
                    documents: paginatedDocuments,
                    pagination: paginationState,
                    error: null,
                  });

                  validDocuments.forEach((document) => clipboardStore.removeDocument(document.key));
                  toastService.success(`${validDocuments.length} Dokument(e) wurden erfolgreich verschoben`);
                }),
                catchError((error) => {
                  patchState(store, {
                    isLoading: false,
                    error: `Fehler beim Verschieben: ${error.message || error}`,
                  });
                  toastService.error(`Fehler beim Verschieben: ${error.message || 'Unbekannter Fehler'}`);
                  return EMPTY;
                }),
              );
            }),
          ),
        ),
        copyDocument: rxMethod<{ document: DocumentModel; targetPath: string }>(
          pipe(
            tap(() => {
              patchState(store, { isLoading: true, error: null });
            }),
            switchMap(({ document, targetPath }) => {
              const targetBucket = store.selectedBucket();
              if (!targetBucket || !document.bucket || !document.key) {
                throw new Error('Fehlende Parameter für Kopieren');
              }
              const targetKey = buildTargetPath(targetPath, document.key);

              return filemanagerService.copyDocument(document, targetBucket, targetKey).pipe(
                switchMap(() => reloadCurrentList()),
                tap((documents) => {
                  const { filteredDocuments, paginatedDocuments, paginationState } =
                    filemanagerHelper.applyFiltersAndPagination(
                      documents,
                      store.searchTerm(),
                      store.sort(),
                      store.pagination().currentPage,
                      store.pagination().pageSize,
                    );

                  patchState(store, {
                    isLoading: false,
                    allDocuments: documents,
                    filteredDocuments,
                    documents: paginatedDocuments,
                    pagination: paginationState,
                    error: null,
                  });
                  if (document.key) {
                    clipboardStore.removeDocument(document.key);
                  }
                  toastService.success(`"${document.name}" wurde erfolgreich kopiert`);
                }),
                catchError((error) => {
                  patchState(store, {
                    isLoading: false,
                    error: `Fehler beim Kopieren: ${error.message || error}`,
                  });
                  toastService.error(`Fehler beim Kopieren: ${error.message || 'Unbekannter Fehler'}`);
                  return EMPTY;
                }),
              );
            }),
          ),
        ),
        copyDocuments: rxMethod<{ documents: DocumentModel[]; targetPath: string }>(
          pipe(
            tap(() => {
              patchState(store, { isLoading: true, error: null });
            }),
            switchMap(({ documents: documentsToCopy, targetPath }) => {
              const targetBucket = store.selectedBucket();
              const validDocuments = documentsToCopy.filter(
                (document) => !!document.bucket && !!document.key,
              ) as Array<DocumentModel & { key: string; bucket: string }>;

              if (!targetBucket || validDocuments.length === 0) {
                patchState(store, {
                  isLoading: false,
                  error: 'Fehlende Parameter für Kopieren',
                });
                return EMPTY;
              }

              const copyRequests = validDocuments.map((document) =>
                filemanagerService.copyDocument(document, targetBucket, buildTargetPath(targetPath, document.key)),
              );

              return forkJoin(copyRequests).pipe(
                switchMap(() => reloadCurrentList()),
                tap((documents) => {
                  const { filteredDocuments, paginatedDocuments, paginationState } =
                    filemanagerHelper.applyFiltersAndPagination(
                      documents,
                      store.searchTerm(),
                      store.sort(),
                      store.pagination().currentPage,
                      store.pagination().pageSize,
                    );

                  patchState(store, {
                    isLoading: false,
                    allDocuments: documents,
                    filteredDocuments,
                    documents: paginatedDocuments,
                    pagination: paginationState,
                    error: null,
                  });

                  validDocuments.forEach((document) => clipboardStore.removeDocument(document.key));
                  toastService.success(`${validDocuments.length} Dokument(e) wurden erfolgreich kopiert`);
                }),
                catchError((error) => {
                  patchState(store, {
                    isLoading: false,
                    error: `Fehler beim Kopieren: ${error.message || error}`,
                  });
                  toastService.error(`Fehler beim Kopieren: ${error.message || 'Unbekannter Fehler'}`);
                  return EMPTY;
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

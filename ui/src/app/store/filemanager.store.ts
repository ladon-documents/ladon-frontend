import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Inject, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { DocumentModel, DocumentsService, LoginRequestModel } from '../../api';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, pipe, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { FilemanagerService } from '../filemanager/filemanager.service';
import { BucketStatsExtended } from '../interfaces/bucket-stats';
import { LadonRouterService } from '../services/ladon-router.service';

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
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

interface FilemanagerState {
  documents: DocumentModel[];
  statistics: BucketStatsExtended | null;
  selectedDocument: DocumentModel | null;
  isLoading: boolean;
  error: string | null;
  sort: SortConfig;
  pagination: PaginationState;
  searchTerm: string;
  selectedBucket: string | null;
}

const initialState: FilemanagerState = {
  documents: [],
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
  },
  searchTerm: '',
};

export const FilemanagerStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, documentsService = inject(FilemanagerService), ladonRouter = inject(LadonRouterService)) => {
    return {
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
      loadStats: rxMethod<any>(
        pipe(
          tap(() => {
            // TODO show loading for stats
          }),
          switchMap((bucket) =>
            documentsService.getStats(bucket).pipe(
              tap(async (stats) => {
                const response = JSON.parse(await stats.text());
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
                throw error;
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
            }));
          }),
          switchMap((bucket) =>
            documentsService.loadBucket(bucket).pipe(
              tap((documents) => {
                patchState(store, (state) => ({
                  ...state,
                  selectedBucket: bucket,
                  isLoading: false,
                  documents,
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
      loadDocumentList: rxMethod<any>(
        pipe(
          tap(() => {
            patchState(store, (state) => ({
              ...state,
              isLoading: true,
            }));
          }),
          switchMap((document) =>
            documentsService.loadDocumentList(document).pipe(
              tap((documents) => {
                patchState(store, (state) => ({
                  ...state,
                  isLoading: false,
                  documents,
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
    };
  }),
);

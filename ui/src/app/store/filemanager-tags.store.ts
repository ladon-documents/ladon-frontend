import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs';
import { Document, Tag } from '@ladon/api';
import { ToastService } from '../shared/services/toast.service';
import { FetchApiFactory } from '../services/api/fetch-api.factory';

export interface FilemanagerTagsState {
  documentId: string | null;
  tags: Tag[];
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
}

const initialState: FilemanagerTagsState = {
  documentId: null,
  tags: [],
  isLoading: false,
  isMutating: false,
  error: null,
};

const normalizeTag = (value: string): string => value.trim().toLowerCase();

const toErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as { error?: { reason?: string } }).error?.reason === 'string'
  ) {
    return (error as { error?: { reason?: string } }).error!.reason!;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: string }).message === 'string'
  ) {
    return (error as { message?: string }).message!;
  }

  return 'Unbekannter Fehler';
};

export const FilemanagerTagsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    hasDocumentId: computed(() => !!store.documentId()),
    hasTags: computed(() => store.tags().length > 0),
  })),
  withMethods((store, apiFactory = inject(FetchApiFactory), toastService = inject(ToastService)) => {
    const methods = {
      clearState() {
        patchState(store, initialState);
      },

      setDocument(document: Document | null) {
        if (document?.isFolder) {
          patchState(store, {
            documentId: null,
            tags: [],
            isLoading: false,
            isMutating: false,
            error: null,
          });
          return;
        }

        const documentId = document?.path ?? document?.key ?? null;

        if (!documentId) {
          patchState(store, {
            documentId: null,
            tags: [],
            isLoading: false,
            isMutating: false,
            error: null,
          });
          return;
        }

        const isSameDocument = store.documentId() === documentId;
        patchState(store, {
          documentId,
          error: null,
          tags: isSameDocument ? store.tags() : [],
        });
        methods.loadTags(documentId);
      },

      loadTags: rxMethod<string>(
        pipe(
          tap((documentId) => {
            patchState(store, {
              documentId,
              isLoading: true,
              error: null,
            });
          }),
          switchMap((documentId) =>
            apiFactory
              .fromApi(() =>
                apiFactory.tagmanagerApi.tags({
                  id: documentId,
                }),
              )
              .pipe(
                tap((tags) => {
                  patchState(store, {
                    tags,
                    isLoading: false,
                    error: null,
                  });
                }),
                catchError((error) => {
                  patchState(store, {
                    isLoading: false,
                    error: toErrorMessage(error),
                  });
                  return EMPTY;
                }),
              ),
          ),
        ),
      ),

      addTag: rxMethod<string>(
        pipe(
          switchMap((rawTagValue) => {
            const documentId = store.documentId();
            const trimmedValue = rawTagValue.trim();
            if (!documentId || !trimmedValue) {
              return EMPTY;
            }

            const normalizedValue = normalizeTag(trimmedValue);
            const duplicateExists = store
              .tags()
              .some(
                (tag) =>
                  normalizeTag(tag.value ?? '') === normalizedValue || normalizeTag(tag.name ?? '') === normalizedValue,
              );

            if (duplicateExists) {
              patchState(store, { error: 'Tag existiert bereits' });
              return EMPTY;
            }

            patchState(store, {
              isMutating: true,
              error: null,
            });

            return apiFactory
              .fromApi(() =>
                apiFactory.tagmanagerApi.addTags({
                  id: documentId,
                  value: trimmedValue,
                }),
              )
              .pipe(
                switchMap(() =>
                  apiFactory.fromApi(() =>
                    apiFactory.tagmanagerApi.tags({
                      id: documentId,
                    }),
                  ),
                ),
                tap((tags) => {
                  patchState(store, {
                    tags,
                    isMutating: false,
                    error: null,
                  });
                  toastService.success('Tag wurde hinzugefügt');
                }),
                catchError((error) => {
                  patchState(store, {
                    isMutating: false,
                    error: toErrorMessage(error),
                  });
                  toastService.error('Fehler beim Hinzufügen des Tags');
                  return EMPTY;
                }),
              );
          }),
        ),
      ),

      deleteTag: rxMethod<string>(
        pipe(
          switchMap((tagId) => {
            const documentId = store.documentId();
            if (!documentId || !tagId) {
              return EMPTY;
            }

            patchState(store, {
              isMutating: true,
              error: null,
            });

            return apiFactory
              .fromApi(() =>
                apiFactory.tagmanagerApi.deleteTag({
                  tagid: tagId,
                }),
              )
              .pipe(
                switchMap(() =>
                  apiFactory.fromApi(() =>
                    apiFactory.tagmanagerApi.tags({
                      id: documentId,
                    }),
                  ),
                ),
                tap((tags) => {
                  patchState(store, {
                    tags,
                    isMutating: false,
                    error: null,
                  });
                  toastService.success('Tag wurde entfernt');
                }),
                catchError((error) => {
                  patchState(store, {
                    isMutating: false,
                    error: toErrorMessage(error),
                  });
                  toastService.error('Fehler beim Entfernen des Tags');
                  return EMPTY;
                }),
              );
          }),
        ),
      ),
    };

    return methods;
  }),
);

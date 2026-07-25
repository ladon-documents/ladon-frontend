import { HttpClient, HttpEvent, HttpEventType, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { pluginFetchClient } from '@ladon/api';
import { catchError, delay, map, mergeMap, Observable, of, scan, throwError } from 'rxjs';
import { FetchApiFactory } from '../../services/api/fetch-api.factory';
import { PluginMetaService } from './plugin-meta.service';
import { PluginChannel, PluginProduct } from '../models/pluginmanager.models';

type PluginModel = pluginFetchClient.Plugin;
type PluginMode = 'UPLOAD' | 'DOWNLOAD' | 'DEINSTALL' | 'FINISH';
type PluginState = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'ERROR' | 'FINISHED';

export interface PluginInstallationState {
  progress: number;
  mode?: PluginMode;
  state: PluginState;
  content: any;
  transactionID?: string;
  plugin?: PluginModel;
  error?: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class PluginInstallationService {
  private readonly PluginUploadApi = '/admin/api/filemanager/_plugin/upload?id=%2Fupload%2F';

  constructor(
    private httpClient: HttpClient,
    private apiFactory: FetchApiFactory,
    private pluginMetaService: PluginMetaService,
  ) {}

  installPlugin(
    plugin: PluginModel,
    product: PluginProduct,
    channel: PluginChannel,
  ): Observable<PluginInstallationState> {
    return this.startInstallation(plugin).pipe(
      mergeMap((state) => this.downloadPlugin(product, channel, state)),
      mergeMap((state) => (this.isPluginStateDone(state) ? this.uploadPlugin(state) : of(state))),
      mergeMap((state) => (this.isPluginStateDone(state) ? this.finishInstallation(state) : of(state))),
      catchError((state: PluginInstallationState) =>
        this.rollbackInstallation(state).pipe(
          mergeMap(() =>
            throwError(() => ({
              ...state,
              state: 'ERROR' as const,
            })),
          ),
        ),
      ),
    );
  }

  installPluginFromBundle(
    plugin: PluginModel,
    product: PluginProduct,
    channel: PluginChannel,
  ): Observable<PluginInstallationState> {
    const initialState: PluginInstallationState = {
      state: 'PENDING',
      progress: 0,
      mode: 'DOWNLOAD',
      content: null,
      plugin,
      transactionID: undefined,
    };

    return this.downloadPlugin(product, channel, initialState).pipe(
      mergeMap((state) => (this.isPluginStateDone(state) ? this.uploadPlugin(state) : of(state))),
      map((state) => (this.isPluginStateDone(state) ? this.transformToFinishedState(state) : state)),
    );
  }

  deinstallPlugin(plugin: PluginModel): Observable<PluginInstallationState> {
    const initialState: PluginInstallationState = {
      state: 'PENDING',
      progress: 0,
      mode: 'DEINSTALL',
      content: null,
      plugin,
      transactionID: undefined,
    };

    if (!plugin || !plugin.name || !plugin.pluginId) {
      return throwError(() => ({
        ...initialState,
        state: 'ERROR' as const,
        error: new Error('Invalid plugin'),
      }));
    }

    if (!this.pluginMetaService.pluginCanDeinstalled(plugin.pluginId)) {
      return throwError(() => ({
        ...initialState,
        state: 'ERROR' as const,
        error: new Error('Plugin cannot be deinstalled'),
      }));
    }

    const payload = {
      bucket: '_system',
      prefix: `etc/plugins/static-web/${plugin.pluginId}`,
      orderby: `created_desc`,
    };

    return this.apiFactory
      .fromApi(() =>
        this.apiFactory.documentsApi.listDocumentJson({
          bucket: payload.bucket,
          prefix: payload.prefix,
          orderby: payload.orderby,
        }),
      )
      .pipe(
        mergeMap((result: any) => {
          const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
          if (!parsedResult || !Array.isArray(parsedResult) || parsedResult.length === 0) {
            return throwError(() => ({
              ...initialState,
              state: 'ERROR' as const,
              error: new Error('No Plugin List found'),
            }));
          }

          const newestVersion = parsedResult[0];
          return this.apiFactory
            .fromApi(() =>
              this.apiFactory.documentsApi.deleteDocument({
                bucket: payload.bucket,
                key: `etc/plugins/static-web/${plugin.pluginId}/${newestVersion.changetoken}.json`,
              }),
            )
            .pipe(
              map(() => ({
                ...initialState,
                state: 'FINISHED' as const,
                progress: 100,
              })),
            );
        }),
      );
  }

  private startInstallation(plugin: PluginModel): Observable<PluginInstallationState> {
    return this.apiFactory
      .fromApi(() => this.apiFactory.transactionApi.startTransaction())
      .pipe(
        mergeMap((response) => {
          if (!response?.txId) {
            return throwError(() => ({
              state: 'ERROR' as const,
              progress: 0,
              mode: 'DOWNLOAD' as const,
              content: null,
              plugin,
              error: new Error('Transaction failed'),
            }));
          }

          return of({
            state: 'PENDING' as const,
            progress: 0,
            mode: 'DOWNLOAD' as const,
            content: null,
            plugin,
            transactionID: response.txId,
          });
        }),
      );
  }

  private downloadPlugin(
    product: PluginProduct,
    channel: PluginChannel,
    state: PluginInstallationState,
  ): Observable<PluginInstallationState> {
    if (!state.plugin?.id) {
      return throwError(() => this.createErrorState(state, 'DOWNLOAD', new Error('Missing plugin id')));
    }

    return this.apiFactory
      .fromApi(() =>
        this.apiFactory.pluginV1Api.pluginContentRaw({
          product,
          channel,
          id: state.plugin?.id || '',
        }),
      )
      .pipe(
        mergeMap(async (response): Promise<PluginInstallationState> => {
          const body = await response.value();
          return {
            ...state,
            mode: 'DOWNLOAD',
            state: 'DONE',
            progress: 100,
            content: {
              headers: response.raw.headers,
              body,
            },
          };
        }),
        catchError((error) => throwError(() => this.createErrorState(state, 'DOWNLOAD', error))),
      );
  }

  private uploadPlugin(state: PluginInstallationState): Observable<PluginInstallationState> {
    if (!state.plugin?.file) {
      return throwError(() => this.createErrorState(state, 'UPLOAD', new Error('Missing plugin file')));
    }

    const responseHeaders = state.content.headers;
    const data = state.content.body instanceof Blob ? state.content.body : new Blob([state.content.body]);
    const headers = this.extractPluginUploadHeaders(responseHeaders);
    const uploadForm = new FormData();
    uploadForm.append('upload', data);
    uploadForm.append('upload_fullpath', state.plugin.file);
    const source$ = this.httpClient.post(this.PluginUploadApi, uploadForm, {
      headers,
      observe: 'events',
      reportProgress: true,
    });
    const initialState: PluginInstallationState = {
      ...state,
      state: 'PENDING',
      progress: 0,
      mode: 'UPLOAD',
      content: null,
    };
    return this.installProgress(source$, initialState).pipe(
      catchError((error) => throwError(() => this.createErrorState(state, 'UPLOAD', error))),
    );
  }

  private finishInstallation(state: PluginInstallationState): Observable<PluginInstallationState> {
    if (!state.transactionID) {
      return throwError(() => this.createErrorState(state, 'FINISH', new Error('Missing transaction id')));
    }

    return this.apiFactory
      .fromApi(() =>
        this.apiFactory.transactionApi.commitTransaction({
          txId: state.transactionID || '',
        }),
      )
      .pipe(
        delay(10),
        mergeMap((result: { success?: boolean }) => {
          if (!result.success) {
            return throwError(() => this.createErrorState(state, 'FINISH', new Error('Commit failed')));
          }

          return of({
            ...state,
            state: 'FINISHED' as const,
            progress: 100,
            mode: 'UPLOAD' as const,
            content: null,
          });
        }),
      );
  }

  private rollbackInstallation(state: PluginInstallationState): Observable<{ success?: boolean } | undefined> {
    return state.transactionID
      ? this.apiFactory.fromApi(() =>
          this.apiFactory.transactionApi.rollbackTransaction({
            txId: state.transactionID || '',
          }),
        )
      : of(undefined);
  }

  private installProgress(
    source: Observable<HttpEvent<any>>,
    initialState: PluginInstallationState,
  ): Observable<PluginInstallationState> {
    return source.pipe(
      scan((pluginInstallState: PluginInstallationState, event: HttpEvent<any>) => {
        if (event.type === HttpEventType.DownloadProgress || event.type === HttpEventType.UploadProgress) {
          return {
            progress: event.total ? Math.round((100 * event.loaded) / event.total) : pluginInstallState.progress,
            state: 'IN_PROGRESS' as const,
            mode: pluginInstallState.mode,
            content: null,
            plugin: pluginInstallState.plugin,
            transactionID: pluginInstallState.transactionID,
          };
        }

        if (event.type === HttpEventType.Response) {
          return {
            progress: 100,
            state: 'DONE' as const,
            mode: pluginInstallState.mode,
            content: event,
            plugin: pluginInstallState.plugin,
            transactionID: pluginInstallState.transactionID,
          };
        }

        return pluginInstallState;
      }, initialState),
    );
  }

  private transformToFinishedState(state: PluginInstallationState): PluginInstallationState {
    return {
      ...state,
      content: null,
      mode: 'UPLOAD',
      progress: 100,
      state: 'FINISHED',
    };
  }

  private isPluginStateDone(state: PluginInstallationState | undefined): boolean {
    return !!state && state.state === 'DONE';
  }

  private createErrorState(
    state: PluginInstallationState,
    mode: PluginMode,
    error: unknown,
  ): PluginInstallationState {
    return {
      ...state,
      mode,
      state: 'ERROR',
      content: null,
      error,
    };
  }

  private extractPluginUploadHeaders(responseHeaders: Headers | HttpHeaders | undefined): HttpHeaders {
    let headers = new HttpHeaders();
    if (!responseHeaders) {
      return headers.append('enctype', 'multipart/form-data');
    }

    if (responseHeaders instanceof Headers) {
      responseHeaders.forEach((value, key) => {
        if (key.includes('ladon-plugin')) {
          headers = headers.append(key, value);
        }
      });
      return headers.append('enctype', 'multipart/form-data');
    }

    const headerKeys = responseHeaders.keys();
    for (const key of headerKeys) {
      if (key.includes('ladon-plugin')) {
        const value = responseHeaders.get(key);
        if (value) {
          headers = headers.append(key, value);
        }
      }
    }

    return headers.append('enctype', 'multipart/form-data');
  }
}

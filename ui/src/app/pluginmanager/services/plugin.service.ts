import { Injectable, signal, WritableSignal } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  delay,
  EMPTY,
  forkJoin,
  from,
  map,
  mergeMap,
  Observable,
  of,
  scan,
  Subject,
  take,
  tap,
  throwError,
} from 'rxjs';
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders } from '@angular/common/http';
import { pluginFetchClient } from '@ladon/api';
import { sortChannels } from '../helper/helper';
import { PluginMetaService } from './plugin-meta.service';
import { FetchApiFactory } from '../../services/api/fetch-api.factory';

type PluginModel = pluginFetchClient.Plugin;

export interface PluginWithVersionStatus extends PluginModel {
  canInstall: boolean;
  canUpdate: boolean;
  canDeinstall: boolean;
  current?: string;
  version?: string;
}

export interface WebBundleWrapper {
  bundleContent?: Array<PluginWithVersionStatus>;
  webBundlePlugin?: PluginWithVersionStatus;
}

export interface ChannelList {
  product: string;
  channel: string;
}

type PluginMode = 'UPLOAD' | 'DOWNLOAD' | 'DEINSTALL';
type PluginState = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'ERROR' | 'FINISHED';

export interface PluginInstallState {
  progress: number;
  mode?: PluginMode;
  state: PluginState;
  content: any;
  transactionID?: string;
  plugin?: PluginModel;
}

@Injectable({
  providedIn: 'root',
})
export class PluginService {
  private readonly PluginUploadApi = '/admin/api/filemanager/_plugin/upload?id=%2Fupload%2F';
  private readonly INITIAL_SELECTED_PLUGIN: PluginWithVersionStatus | undefined = undefined;
  private readonly PLUGIN_DEFAULT_README_PAGE = 'https://ladon.org';
  private readonly SPEC_TYPE_WEB_BUNDLE = 'web-bundle';

  private pluginsSignal$: WritableSignal<Array<PluginWithVersionStatus>> = signal<Array<PluginWithVersionStatus>>([]);
  private filteredText$: WritableSignal<string> = signal<string>('');
  private isLoadingPlugins$: WritableSignal<boolean> = signal<boolean>(true);
  private pluginInfoUrl$: WritableSignal<string> = signal<string>(this.PLUGIN_DEFAULT_README_PAGE);

  private currentInstallations$ = new Subject<any>();
  private product: string | any = 'ladon';
  private channel: string | any = 'stable';
  private bundleContentWithVersions: Array<PluginWithVersionStatus> = [];
  private currentInstallations: any = {};
  private errorState: PluginInstallState = {
    progress: 0,
    mode: undefined,
    state: 'ERROR',
    content: null,
    plugin: undefined,
    transactionID: undefined,
  };

  private selectedPlugin$: BehaviorSubject<PluginWithVersionStatus | undefined> = new BehaviorSubject(
    this.INITIAL_SELECTED_PLUGIN,
  );

  private iFrameSubject$: BehaviorSubject<string> = new BehaviorSubject(this.PLUGIN_DEFAULT_README_PAGE);

  constructor(
    private httpClient: HttpClient,
    private apiFactory: FetchApiFactory,
    private pluginMetaService: PluginMetaService,
  ) {}

  readonly iFrameUrl = this.iFrameSubject$.asObservable();
  readonly selectedPlugin = this.selectedPlugin$.asObservable();

  setSelectedItem(selectedItem: PluginWithVersionStatus) {
    this.selectedPlugin$.next(selectedItem);
    this.pluginInfoUrl$.set(this.getDocsUrl(selectedItem.id));
  }

  get plugins() {
    return this.pluginsSignal$.asReadonly();
  }
  get pluginInfoUrl() {
    return this.pluginInfoUrl$.asReadonly();
  }

  get filteredText() {
    return this.filteredText$.asReadonly();
  }

  get isLoadingPlugins() {
    return this.isLoadingPlugins$.asReadonly();
  }

  getPluginChannels(): Observable<Array<ChannelList>> {
    return this.pluginMetaService.getPluginConfig().pipe(
      take(1),
      map((config) => {
        if (config && Array.isArray(config) && config.length > 0) {
          config = sortChannels(config);
          this.product = config[0].product || this.product;
          this.channel = config[0].channel || this.channel;
          return config;
        }
        return null;
      }),
    );
  }

  isInstalling(): Observable<any> {
    return this.currentInstallations$.asObservable();
  }

  changeChannel(channel: string): void {
    if (channel) {
      this.channel = channel;
    }
    this._getPlugins();
  }

  reloadPlugin(): void {
    this._getPlugins();
  }

  private getWebBundle(): Observable<PluginWithVersionStatus | undefined> {
    const webBundle: WebBundleWrapper = {
      bundleContent: undefined,
      webBundlePlugin: undefined,
    };

    return from(this.apiFactory.pluginV1Api.plugins({ product: 'ladon', channel: this.channel as any })).pipe(
      mergeMap((plugins: Array<PluginModel>) => {
        const webbundlePlugin: any = plugins.find((item: PluginModel) => {
          return item.spec?.type === this.SPEC_TYPE_WEB_BUNDLE;
        });
        if (webbundlePlugin) {
          webbundlePlugin.canUpdate = false;
          webbundlePlugin.canInstall = false;
          webbundlePlugin.current = webbundlePlugin.version;
          return from(
            this.apiFactory.pluginV1Api.bundleContent({
              product: 'ladon',
              channel: this.channel as any,
              id: webbundlePlugin.id,
            }),
          ).pipe(
            mergeMap((bundlePlugins: Array<PluginModel>) => {
              return this.pluginMetaService.setVersions(bundlePlugins);
            }),
            map((bundleContentWithVersions) => {
              this.bundleContentWithVersions = bundleContentWithVersions;
              const isUpdatable = this.bundleContentWithVersions.find((plugin) => {
                return plugin.canInstall || plugin.canUpdate;
              });
              if (isUpdatable) {
                webbundlePlugin.canUpdate = true;
              }
              webBundle.bundleContent = this.bundleContentWithVersions;
              webBundle.webBundlePlugin = webbundlePlugin;
              return webBundle.webBundlePlugin;
            }),
          );
        }
        return of(undefined);
      }),
    );
  }

  private _getPlugins(): void {
    this.isLoadingPlugins$.set(true);
    this.getWebBundle()
      .pipe(
        take(1),
        mergeMap((bundleResults: PluginWithVersionStatus | undefined) => {
          return from(this.apiFactory.pluginV1Api.plugins({ product: 'ladon', channel: this.channel as any })).pipe(
            map((plugins: Array<PluginModel>) => {
              return {
                plugins,
                webbundle: bundleResults,
              };
            }),
          );
        }),
        mergeMap((result: { plugins: Array<PluginModel>; webbundle: PluginWithVersionStatus | undefined }) => {
          if (result.plugins && Array.isArray(result.plugins)) {
            const filtered = result.plugins.filter((plugin: PluginModel) => {
              return plugin.spec?.type !== this.SPEC_TYPE_WEB_BUNDLE;
            });
            return this.pluginMetaService.setVersions(filtered).pipe(
              map((versionedPlugins) => {
                return {
                  versionedPlugins,
                  webbundle: result.webbundle,
                };
              }),
            );
          }
          return of({
            versionedPlugins: [],
            webbundle: result.webbundle,
          });
        }),
        catchError((e) => {
          // Emit Subject to make spinner disapear
          this.pluginsSignal$.set([]);
          return throwError(e);
        }),
        map((result: { versionedPlugins: Array<any>; webbundle: PluginWithVersionStatus | undefined }) => {
          if (
            result &&
            result.versionedPlugins &&
            Array.isArray(result.versionedPlugins) &&
            result.versionedPlugins.length > 0
          ) {
            if (result.webbundle) {
              result.versionedPlugins.unshift(result.webbundle);
            }
          }
          return result.versionedPlugins;
        }),
      )
      .subscribe((versionedPlugins) => {
        this.pluginsSignal$.set(versionedPlugins);
        this.isLoadingPlugins$.set(false);
      });
  }

  public getPluginDescription(pluginId: string): Observable<string> {
    return from(
      this.apiFactory.pluginV1Api.pluginReadme({
        product: 'ladon',
        channel: this.channel as any,
        id: pluginId,
      }),
    );
  }

  private getDocsUrl(id?: string): string {
    if (id) {
      //return this.pluginmanagerService.pluginReadme(this.product, this.channel, id);
      return `https://plugins.mind-consulting.de/plugins/mind/channel/${this.product}/${this.channel}/readme/${id}`;
    } else {
      return this.PLUGIN_DEFAULT_README_PAGE;
    }
  }

  public installBundle(webBundle: PluginModel): Observable<any> {
    const pluginsToBeUpdated: Array<PluginWithVersionStatus> = this.bundleContentWithVersions.filter((plugin) => {
      return plugin.canInstall || plugin.canUpdate;
    });
    if (pluginsToBeUpdated && Array.isArray(pluginsToBeUpdated) && pluginsToBeUpdated.length > 0) {
      return this.startInstallation(webBundle).pipe(
        mergeMap((state: PluginInstallState | undefined) => {
          const upload = [];
          for (const pl of pluginsToBeUpdated) {
            upload.push(this.installPluginFromBundle(pl));
          }
          return state ? forkJoin(upload) : throwError(() => new Error('Invalid state'));
        }),
        catchError((errorState: PluginInstallState) => {
          return this.rollbackInstallation(errorState).pipe(
            map((vlv) => {
              this.currentInstallations = {};
              this.currentInstallations$.next(this.currentInstallations);
              return of(errorState);
            }),
          );
        }),
      );
    }
    // Return empty obs when no plugins
    return EMPTY;
  }

  public deintallPlugin(pluginItem: PluginModel): Observable<any> {
    if (!pluginItem || !pluginItem.name) {
      return of(undefined);
    }
    if (pluginItem.pluginId && !this.pluginMetaService.pluginCanDeinstalled(pluginItem.pluginId)) {
      return of(undefined);
    }
    const pluginName = pluginItem.name;
    const initialState: PluginInstallState = {
      state: 'PENDING',
      progress: 0,
      mode: 'DEINSTALL',
      content: null,
      plugin: pluginItem,
      transactionID: undefined,
    };
    const payload = {
      bucket: '_system',
      prefix: `etc/plugins/static-web/${pluginItem.pluginId}`,
      orderby: `created_desc`,
      key: '',
    };
    return from(
      this.apiFactory.documentsApi.listDocumentJson({
        bucket: payload.bucket,
        prefix: payload.prefix,
        orderby: payload.orderby,
      }),
    ).pipe(
      mergeMap((result: any) => {
        const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
        if (parsedResult && Array.isArray(parsedResult)) {
          this.currentInstallations[pluginName] = initialState;
          this.currentInstallations$.next(this.currentInstallations);
          const newestVersion = parsedResult[0];
          const key = newestVersion.changetoken;
          payload.key = `etc/plugins/static-web/${pluginItem.pluginId}/${key}.json`;
          return from(
            this.apiFactory.documentsApi.deleteDocument({
              bucket: payload.bucket,
              key: payload.key,
            }),
          ).pipe(
            tap((v) => {
              this.currentInstallations[pluginName] = {
                ...initialState,
                state: 'FINISHED',
              };
              this.currentInstallations$.next(this.currentInstallations);
            }),
          );
        }
        return throwError(() => new Error('No Plugin List found'));
      }),
      tap(() => {
        this.pluginInstallFinished(pluginName);
        this.reloadPlugin();
      }),
      catchError((err) => {
        return throwError(err);
      }),
    );
  }

  public installPlugin(pluginItem: PluginModel): Observable<any> {
    if (!pluginItem) {
      return of(undefined);
    }

    return this.startInstallation(pluginItem).pipe(
      mergeMap((state: PluginInstallState | undefined) => {
        if (state && pluginItem.name) {
          this.currentInstallations[pluginItem.name] = null;
          return this.downloadPlugin(state);
        } else {
          return throwError(() => new Error('Transaction failed'));
        }
      }),
      mergeMap((pluginState: PluginInstallState) => {
        return this.isPluginStateDone(pluginState) ? this.uploadPlugin(pluginState) : of(pluginState);
      }),
      mergeMap((pluginState: PluginInstallState) => {
        return this.isPluginStateDone(pluginState) ? this.finishInstallation(pluginState) : of(pluginState);
      }),
      tap((pluginState: PluginInstallState | undefined) => {
        if (pluginItem.name) {
          this.currentInstallations[pluginItem.name] = pluginState;
          this.currentInstallations$.next(this.currentInstallations);
          if (pluginState && pluginState.state === 'FINISHED') {
            this.pluginInstallFinished(pluginItem.name);
          }
        }
      }),
      catchError((errorState: PluginInstallState) => {
        console.log('catchError rollbackInstallation');
        console.dir(errorState);
        return this.rollbackInstallation(errorState).pipe(
          map((vlv) => {
            console.log('rollbackInstallation');
            console.dir(errorState);
            if (pluginItem.name) {
              this.currentInstallations[pluginItem.name] = {
                ...this.currentInstallations[pluginItem.name],
                state: 'ERROR',
              };
              this.pluginInstallFinished(pluginItem.name);
            }
            return of(errorState);
          }),
        );
      }),
    );
  }

  private installPluginFromBundle(pluginItem: PluginModel): Observable<any> {
    console.log('invoking installPluginFromBundle ' + pluginItem.id);
    if (pluginItem.name) {
      this.currentInstallations[pluginItem.name] = null;
    }
    const initialState = {
      state: 'PENDING',
      progress: 0,
      mode: 'DOWNLOAD',
      content: null,
      plugin: pluginItem,
      transactionID: undefined,
    } as PluginInstallState;

    return this.downloadPlugin(initialState).pipe(
      mergeMap((pluginState: PluginInstallState) => {
        return this.isPluginStateDone(pluginState) ? this.uploadPlugin(pluginState) : of(pluginState);
      }),
      mergeMap((pluginState: PluginInstallState) => {
        return this.isPluginStateDone(pluginState) ? of(this.transformToFinishedState(pluginState)) : of(pluginState);
      }),
      tap((pluginState: PluginInstallState) => {
        if (pluginItem.name) {
          this.currentInstallations[pluginItem.name] = pluginState;
          this.currentInstallations$.next(this.currentInstallations);
          if (pluginState.state === 'FINISHED') {
            this.pluginInstallFinished(pluginItem.name);
          }
        }
      }),
      tap((pluginState) => {
        console.log(pluginState);
        if (pluginItem?.name) {
          console.log(this.currentInstallations[pluginItem.name]);
        }
      }),
    );
  }

  private downloadPlugin(state: PluginInstallState): Observable<PluginInstallState> {
    const createErrorState = (): PluginInstallState => ({
      ...this.errorState,
      mode: 'DOWNLOAD',
      content: null,
      plugin: state.plugin,
    });

    try {
      if (!state.plugin || !state.plugin.id) {
        return throwError(() => createErrorState());
      }
      const { id } = state.plugin;
      return from(
        this.apiFactory.pluginV1Api.pluginContentRaw({
          product: 'ladon',
          channel: this.channel as any,
          id,
        }),
      ).pipe(
        mergeMap(async (response): Promise<PluginInstallState> => {
          const body = await response.value();
          return {
            ...state,
            mode: 'DOWNLOAD' as const,
            state: 'DONE' as const,
            progress: 100,
            content: {
              headers: response.raw.headers,
              body,
            },
          };
        }),
      );
    } catch (e) {
      return throwError(() => createErrorState());
    }
  }

  private uploadPlugin(state: PluginInstallState): Observable<PluginInstallState> {
    const createErrorState = (): PluginInstallState => ({
      ...this.errorState,
      mode: state.mode,
      plugin: state.plugin,
      transactionID: state.transactionID,
    });

    try {
      if (!state.plugin || !state.plugin.file) {
        return throwError(() => createErrorState());
      }
      const { file } = state.plugin;
      const responseHeaders = state.content.headers;
      const data = state.content.body instanceof Blob ? state.content.body : new Blob([state.content.body]);
      const headers = this.extractPluginUploadHeaders(responseHeaders);
      const uploadForm = new FormData();
      uploadForm.append('upload', data);
      uploadForm.append('upload_fullpath', file);
      const source$ = this.httpClient.post(this.PluginUploadApi, uploadForm, {
        headers,
        observe: 'events',
        reportProgress: true,
      });
      const initialState: PluginInstallState = {
        ...state,
        state: 'PENDING',
        progress: 0,
        mode: 'UPLOAD',
        content: null,
      };
      return this.installProgress(source$, state.plugin, initialState);
    } catch (e) {
      return throwError(() => createErrorState());
    }
  }

  private startInstallation(pluginItem: PluginModel): Observable<PluginInstallState | undefined> {
    return from(this.apiFactory.transactionApi.startTransaction()).pipe(
      map((response) => {
        if (response) {
          return {
            state: 'PENDING',
            progress: 0,
            mode: 'DOWNLOAD',
            content: null,
            plugin: pluginItem,
            transactionID: response.txId,
          } as PluginInstallState;
        }
        return undefined;
      }),
    );
  }

  private finishInstallation(pluginState: PluginInstallState): Observable<PluginInstallState | undefined> {
    if (!pluginState.transactionID) return of(undefined);
    return from(
      this.apiFactory.transactionApi.commitTransaction({
        txId: pluginState.transactionID,
      }),
    ).pipe(
      delay(10),
      mergeMap((result: { success?: boolean }) => {
        const state: PluginInstallState = {
          ...pluginState,
          state: 'FINISHED',
          progress: 100,
          mode: 'UPLOAD',
          content: null,
        };
        return result.success ? of(state) : throwError(() => state);
      }),
    );
  }

  private rollbackInstallation(pluginState: PluginInstallState): Observable<{ success?: boolean } | undefined> {
    return pluginState.transactionID
      ? from(
          this.apiFactory.transactionApi.rollbackTransaction({
            txId: pluginState.transactionID,
          }),
        )
      : of(undefined);
  }

  // tslint:disable-next-line:max-line-length
  private installProgress(
    source: Observable<HttpEvent<any>>,
    pluginItem: PluginModel,
    initialState: PluginInstallState,
  ): Observable<PluginInstallState> {
    if (initialState.mode === 'DOWNLOAD' && pluginItem.name) {
      this.currentInstallations[pluginItem.name] = null;
    }
    return source.pipe(
      scan((pluginInstallState: PluginInstallState, event: HttpEvent<any>) => {
        if (event.type === HttpEventType.DownloadProgress || event.type === HttpEventType.UploadProgress) {
          return {
            progress: event.total ? Math.round((100 * event.loaded) / event.total) : pluginInstallState.progress,
            state: 'IN_PROGRESS',
            mode: pluginInstallState.mode,
            content: null,
            plugin: pluginInstallState.plugin,
            transactionID: pluginInstallState.transactionID,
          };
        }
        if (event.type === HttpEventType.Response) {
          return {
            progress: 100,
            state: 'DONE',
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

  private pluginInstallFinished(pluginName: string): void {
    delete this.currentInstallations[pluginName];
    this.currentInstallations$.next(this.currentInstallations);
  }

  private transformToFinishedState(pluginState: PluginInstallState): PluginInstallState {
    return {
      ...pluginState,
      content: null,
      mode: 'UPLOAD',
      progress: 100,
      state: 'FINISHED',
    };
  }

  private isPluginStateDone(pluginState: PluginInstallState | undefined): boolean {
    return !!pluginState && pluginState.state === 'DONE';
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

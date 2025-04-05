import { Injectable, signal, WritableSignal } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  delay,
  EMPTY,
  forkJoin,
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
import { DocumentsService, TransactionService, ResponseSuccessModel } from '../../../api';
import { sortChannels } from '../helper/helper';
import { V1Service, PluginModel } from '../../../plugin';
import { PluginMetaService } from './plugin-meta.service';

export interface PluginWithVersionStatus extends PluginModel {
  canInstall: boolean;
  canUpdate: boolean;
  canDeinstall: boolean;
  current: string | null;
  version: string | null;
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
    private pluginmanagerService: V1Service,
    private pluginMetaService: PluginMetaService,
    private transactionService: TransactionService,
    private documentService: DocumentsService,
  ) {}

  readonly iFrameUrl = this.iFrameSubject$.asObservable();
  readonly selectedPlugin = this.selectedPlugin$.asObservable();


  setSelectedItem(selectedItem: PluginWithVersionStatus) {
    this.selectedPlugin$.next(selectedItem);
    this.pluginInfoUrl$.set(this.getDocsUrl(selectedItem.id))
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

    return this.pluginmanagerService.plugins(this.product, this.channel).pipe(
      mergeMap((plugins: Array<PluginModel>) => {
        const webbundlePlugin: any = plugins.find((item: PluginModel) => {
          return item.spec?.type === this.SPEC_TYPE_WEB_BUNDLE;
        });
        if (webbundlePlugin) {
          webbundlePlugin.canUpdate = false;
          webbundlePlugin.canInstall = false;
          webbundlePlugin.current = webbundlePlugin.version;
          return this.pluginmanagerService.bundleContent(this.product, this.channel, webbundlePlugin.id).pipe(
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
        (take(1)),
        mergeMap((bundleResults: PluginWithVersionStatus | undefined) => {
          return this.pluginmanagerService.plugins(this.product, this.channel).pipe(
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
    return this.pluginmanagerService.pluginReadme(this.product, this.channel, pluginId);
  }

  private getDocsUrl(id?: string):string {
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

  public deintallPlugin(plugin: PluginModel): Observable<any> {
    if (!plugin || !plugin.name) {
      return of(undefined);
    }
    if (plugin.pluginId && !this.pluginMetaService.pluginCanDeinstalled(plugin.pluginId)) {
      return of(undefined);
    }
    const pluginName = plugin.name;
    const initialState: PluginInstallState = {
      state: 'PENDING',
      progress: 0,
      mode: 'DEINSTALL',
      content: null,
      plugin,
      transactionID: undefined,
    };
    const payload = {
      bucket: '_system',
      prefix: `etc/plugins/static-web/${plugin.pluginId}`,
      orderby: `created_desc`,
      key: '',
    };
    const params = new URLSearchParams();
    params.set('prefix', `etc/plugins/static-web/${plugin.pluginId}`);
    params.set('orderby', `created_desc`);

    return this.documentService.listDocumentJson(payload.bucket, payload.prefix, payload.orderby).pipe(
      mergeMap((result: any) => {
        if (result && Array.isArray(result)) {
          this.currentInstallations[pluginName] = initialState;
          this.currentInstallations$.next(this.currentInstallations);
          const newestVersion = result[0];
          const key = newestVersion.changetoken;
          payload.key = `etc/plugins/static-web/${plugin.pluginId}/${key}.json`;
          return this.documentService.deleteDocument(payload.bucket, payload.key).pipe(
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

  public installPlugin(plugin: PluginModel): Observable<any> {
    if (!plugin) {
      return of(undefined);
    }

    return this.startInstallation(plugin).pipe(
      mergeMap((state: PluginInstallState | undefined) => {
        if (state && plugin.name) {
          this.currentInstallations[plugin.name] = null;
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
        if (plugin.name) {
          this.currentInstallations[plugin.name] = pluginState;
          this.currentInstallations$.next(this.currentInstallations);
          if (pluginState && pluginState.state === 'FINISHED') {
            this.pluginInstallFinished(plugin.name);
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
            if (plugin.name) {
              this.currentInstallations[plugin.name] = {
                ...this.currentInstallations[plugin.name],
                state: 'ERROR',
              };
              this.pluginInstallFinished(plugin.name);
            }
            return of(errorState);
          }),
        );
      }),
    );
  }

  private installPluginFromBundle(plugin: PluginModel): Observable<any> {
    console.log('invoking installPluginFromBundle ' + plugin.id);
    if (plugin.name) {
      this.currentInstallations[plugin.name] = null;
    }
    const initialState = {
      state: 'PENDING',
      progress: 0,
      mode: 'DOWNLOAD',
      content: null,
      plugin,
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
        if (plugin.name) {
          this.currentInstallations[plugin.name] = pluginState;
          this.currentInstallations$.next(this.currentInstallations);
          if (pluginState.state === 'FINISHED') {
            this.pluginInstallFinished(plugin.name);
          }
        }
      }),
      tap((pluginState) => {
        console.log(pluginState);
        if (plugin?.name) {
          console.log(this.currentInstallations[plugin.name]);
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
      const pluginContentStream$ = this.pluginmanagerService.pluginContent(
        this.product,
        this.channel,
        id,
        'events',
        true,
      );
      const updatedState: PluginInstallState = {
        ...state,
        mode: 'DOWNLOAD',
      };

      return this.installProgress(pluginContentStream$, state.plugin, updatedState);
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
      const data = new Blob([state.content.body]);
      const keys: Array<string> = [];
      let headers = new HttpHeaders();

      responseHeaders.forEach((key: string) => {
        keys.push(key);
      });
      const filteredHeaders = keys.filter((key) => key.includes('ladon-plugin'));
      filteredHeaders.forEach((key) => {
        headers = headers.append(key, responseHeaders.get(key));
      });
      headers = headers.append('enctype', 'multipart/form-data');
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

  private startInstallation(plugin: PluginModel): Observable<PluginInstallState | undefined> {
    return this.transactionService.startTransaction().pipe(
      map((response) => {
        if (response) {
          return {
            state: 'PENDING',
            progress: 0,
            mode: 'DOWNLOAD',
            content: null,
            plugin,
            transactionID: response.txId,
          } as PluginInstallState;
        }
        return undefined;
      }),
    );
  }

  private finishInstallation(pluginState: PluginInstallState): Observable<PluginInstallState | undefined> {
    if (!pluginState.transactionID) return of(undefined);
    return this.transactionService.commitTransaction(pluginState.transactionID).pipe(
      delay(10),
      mergeMap((result: ResponseSuccessModel) => {
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

  private rollbackInstallation(pluginState: PluginInstallState): Observable<ResponseSuccessModel | undefined> {
    return pluginState.transactionID
      ? this.transactionService.rollbackTransaction(pluginState.transactionID)
      : of(undefined);
  }

  // tslint:disable-next-line:max-line-length
  private installProgress(
    source: Observable<HttpEvent<unknown>>,
    plugin: PluginModel,
    initialState: PluginInstallState,
  ): Observable<PluginInstallState> {
    if (initialState.mode === 'DOWNLOAD' && plugin.name) {
      this.currentInstallations[plugin.name] = null;
    }
    return source.pipe(
      scan((pluginInstallState: PluginInstallState, event: HttpEvent<unknown>) => {
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
}

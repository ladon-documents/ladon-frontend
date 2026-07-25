import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { catchError, forkJoin, map, of, pipe, switchMap, tap } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pluginFetchClient } from '@ladon/api';
import {
  ChannelList,
  PluginChannel,
  PluginManagerAction,
  PluginManagerActionType,
  PluginManagerError,
  PluginManagerItem,
  PluginProduct,
} from '../pluginmanager/models/pluginmanager.models';
import {
  calculatePluginOverview,
  filterPluginItems,
  toPluginManagerItems,
} from '../pluginmanager/utils/pluginmanager.mappers';
import { PluginService } from '../pluginmanager/services/plugin.service';
import { PluginInstallationService } from '../pluginmanager/services/plugin-installation.service';
import { ToastService } from '../shared/services/toast.service';

const DEFAULT_PRODUCT: PluginProduct = 'ladon';
const SPEC_TYPE_WEB_BUNDLE = 'web-bundle';
const REQUIRED_PLUGIN_IDS = [
  'mind/mf-ladon-config',
  'mind/mf-ladon-utility-api',
  'mind/mf-ladon-auth-api',
  'mind/mf-ladon-main-nav',
];

type Plugin = pluginFetchClient.Plugin;
type BundleContentByPluginId = Record<string, Plugin[]>;

interface PluginManagerState {
  product: PluginProduct;
  channels: ChannelList[];
  activeChannel: PluginChannel | null;
  items: PluginManagerItem[];
  selectedPluginId: string | null;
  searchTerm: string;
  isLoadingChannels: boolean;
  isLoadingPlugins: boolean;
  loadError: PluginManagerError | null;
  actionError: PluginManagerError | null;
  activeAction: PluginManagerAction | null;
  normalizedChannel: string | null;
}

const initialState: PluginManagerState = {
  product: DEFAULT_PRODUCT,
  channels: [],
  activeChannel: null,
  items: [],
  selectedPluginId: null,
  searchTerm: '',
  isLoadingChannels: false,
  isLoadingPlugins: false,
  loadError: null,
  actionError: null,
  activeAction: null,
  normalizedChannel: null,
};

function getPluginKey(plugin: Plugin): string {
  return plugin.pluginId || plugin.spec?.id || plugin.id || '';
}

function isWebBundle(plugin: Plugin): boolean {
  return plugin.spec?.type === SPEC_TYPE_WEB_BUNDLE;
}

function getActionPhase(actionType: PluginManagerActionType): PluginManagerAction['phase'] {
  return actionType === 'deinstall' ? 'starting' : 'download';
}

export const PluginManagerStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    filteredItems: computed(() => filterPluginItems(store.items(), store.searchTerm())),
    selectedPlugin: computed(() => {
      const selectedPluginId = store.selectedPluginId();
      return store.items().find((item) => item.pluginId === selectedPluginId) || null;
    }),
    overview: computed(() => calculatePluginOverview(store.items(), store.activeAction(), store.actionError())),
    hasChannels: computed(() => store.channels().length > 0),
    isBusy: computed(() => store.isLoadingChannels() || store.isLoadingPlugins() || !!store.activeAction()),
    canRunAction: computed(() => !store.activeAction()),
  })),
  withMethods(
    (
      store,
      pluginService = inject(PluginService),
      installationService = inject(PluginInstallationService),
      toastService = inject(ToastService),
    ) => {
      const loadPluginsForChannel = (channel: PluginChannel, preserveSelection = false) => {
        const product = store.product();
        const selectedPluginId = preserveSelection ? store.selectedPluginId() : null;

        patchState(store, {
          activeChannel: channel,
          selectedPluginId,
          isLoadingPlugins: true,
          loadError: null,
          actionError: null,
        });

        return forkJoin({
          plugins: pluginService.loadPlugins(product, channel),
          installedVersions: pluginService.loadInstalledVersions(),
        }).pipe(
          switchMap(({ plugins, installedVersions }) => {
            const bundlePlugins = plugins.filter(isWebBundle);
            const bundleRequests = bundlePlugins.map((bundlePlugin) =>
              pluginService.loadBundleContent(product, channel, bundlePlugin.id || '').pipe(
                map((bundleContent) => [getPluginKey(bundlePlugin), bundleContent] as const),
                catchError(() => of([getPluginKey(bundlePlugin), [] as Plugin[]] as const)),
              ),
            );

            return (bundleRequests.length > 0 ? forkJoin(bundleRequests) : of([])).pipe(
              map((bundleEntries) => {
                const bundleContentByPluginId = bundleEntries.reduce<BundleContentByPluginId>(
                  (result, [pluginId, bundleContent]) => ({
                    ...result,
                    [pluginId]: bundleContent,
                  }),
                  {},
                );
                const items = toPluginManagerItems(
                  plugins,
                  installedVersions,
                  REQUIRED_PLUGIN_IDS,
                  bundleContentByPluginId,
                ).map((item) => ({
                  ...item,
                  documentationUrl: pluginService.resolveDocumentationUrl(product, channel, item.id),
                }));
                const nextSelectedPluginId =
                  selectedPluginId && items.some((item) => item.pluginId === selectedPluginId)
                    ? selectedPluginId
                    : null;

                return {
                  items,
                  selectedPluginId: nextSelectedPluginId,
                };
              }),
            );
          }),
          tap(({ items, selectedPluginId }) => {
            patchState(store, {
              items,
              selectedPluginId,
              isLoadingPlugins: false,
              loadError: null,
            });
          }),
          catchError((error) => {
            patchState(store, {
              items: [],
              selectedPluginId: null,
              isLoadingPlugins: false,
              loadError: {
                message: 'Plugins konnten nicht geladen werden',
                cause: error,
              },
            });
            return of(null);
          }),
        );
      };

      const methods = {
        initialize: rxMethod<string | null>(
          pipe(
            tap(() => patchState(store, { isLoadingChannels: true, loadError: null, normalizedChannel: null })),
            switchMap((routeChannel) =>
              pluginService.loadChannels().pipe(
                switchMap((channels) => {
                  const fallbackChannel = channels[0]?.channel || null;
                  const routeChannelExists = !!routeChannel && channels.some((item) => item.channel === routeChannel);
                  const activeChannel = routeChannelExists ? (routeChannel as PluginChannel) : fallbackChannel;

                  patchState(store, {
                    channels,
                    product: channels[0]?.product || DEFAULT_PRODUCT,
                    activeChannel,
                    normalizedChannel: routeChannel && !routeChannelExists && activeChannel ? activeChannel : null,
                    isLoadingChannels: false,
                  });

                  return activeChannel ? loadPluginsForChannel(activeChannel) : of(null);
                }),
                catchError((error) => {
                  patchState(store, {
                    channels: [],
                    activeChannel: null,
                    normalizedChannel: null,
                    isLoadingChannels: false,
                    loadError: {
                      message: 'Plugin Channels konnten nicht geladen werden',
                      cause: error,
                    },
                  });
                  return of(null);
                }),
              ),
            ),
          ),
        ),

        loadPluginsForActiveChannel: rxMethod<void>(
          pipe(
            switchMap(() => {
              const activeChannel = store.activeChannel();
              return activeChannel ? loadPluginsForChannel(activeChannel, true) : of(null);
            }),
          ),
        ),

        changeChannel: rxMethod<PluginChannel>(
          pipe(
            switchMap((channel) => {
              patchState(store, {
                selectedPluginId: null,
                actionError: null,
                normalizedChannel: null,
              });
              return loadPluginsForChannel(channel);
            }),
          ),
        ),

        runPluginAction: rxMethod<{ item: PluginManagerItem; actionType: PluginManagerActionType }>(
          pipe(
            switchMap(({ item, actionType }) => {
              if (store.activeAction()) {
                return of(null);
              }
              const activeChannel = store.activeChannel();
              if (!activeChannel) {
                return of(null);
              }

              patchState(store, {
                activeAction: {
                  pluginId: item.pluginId,
                  actionType,
                  phase: getActionPhase(actionType),
                  progress: 0,
                },
                actionError: null,
              });

              const action$ =
                actionType === 'deinstall'
                  ? installationService.deinstallPlugin(item.rawPlugin)
                  : installationService.installPlugin(item.rawPlugin, store.product(), activeChannel);

              return action$.pipe(
                switchMap((state) => {
                  patchState(store, {
                    activeAction: state
                      ? {
                          pluginId: item.pluginId,
                          actionType,
                          phase: state.state === 'FINISHED' ? 'done' : 'upload',
                          progress: state.progress,
                        }
                      : null,
                  });
                  return loadPluginsForChannel(activeChannel, true);
                }),
                tap(() => {
                  patchState(store, { activeAction: null });
                }),
                catchError((error) => {
                  const actionError = {
                    pluginId: item.pluginId,
                    phase: 'error' as const,
                    message: 'Plugin-Aktion fehlgeschlagen',
                    cause: error,
                  };
                  patchState(store, {
                    actionError,
                    activeAction: null,
                  });
                  toastService.error(actionError.message);
                  return of(null);
                }),
              );
            }),
          ),
        ),

        setSearchTerm(searchTerm: string) {
          patchState(store, { searchTerm });
        },

        selectPlugin(pluginId: string | null) {
          const selectedPluginId =
            pluginId && store.items().some((item) => item.pluginId === pluginId) ? pluginId : null;
          patchState(store, { selectedPluginId });
        },

        setActionError(actionError: PluginManagerError | null) {
          patchState(store, { actionError });
        },

        setActiveAction(activeAction: PluginManagerAction | null) {
          patchState(store, { activeAction });
        },

        reset() {
          patchState(store, initialState);
        },
      };

      return methods;
    },
  ),
);

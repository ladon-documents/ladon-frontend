import { pluginFetchClient } from '@ladon/api';
import {
  BundleContentByPluginId,
  InstalledPluginVersions,
  PluginManagerAction,
  PluginManagerError,
  PluginManagerItem,
  PluginManagerOverview,
  PluginManagerStatus,
} from '../models/pluginmanager.models';

const SPEC_TYPE_WEB_BUNDLE = 'web-bundle';

type Plugin = pluginFetchClient.Plugin;

function getPluginId(plugin: Plugin): string {
  return plugin.pluginId || plugin.spec?.id || plugin.id || '';
}

function getPluginType(plugin: Plugin): string | null {
  return plugin.spec?.type  || null;
}

function getPluginName(plugin: Plugin, pluginId: string): string {
  return plugin.name || plugin.spec?.name || pluginId;
}

function getStatus(
  installedVersion: string | null,
  availableVersion: string | null,
  isRequired: boolean,
): PluginManagerStatus {
  if (isRequired && installedVersion) {
    return 'required';
  }

  if (!installedVersion) {
    return 'notInstalled';
  }

  return installedVersion === availableVersion ? 'installed' : 'updateAvailable';
}

function hasBundleUpdate(bundleItems: PluginManagerItem[]): boolean {
  return bundleItems.some((item) => item.canInstall || item.canUpdate);
}

export function toPluginManagerItem(
  plugin: Plugin,
  installedVersions: InstalledPluginVersions,
  requiredPluginIds: string[],
  bundleContent: Plugin[] = [],
): PluginManagerItem {
  const pluginId = getPluginId(plugin);
  const type = getPluginType(plugin);
  const isBundle = type === SPEC_TYPE_WEB_BUNDLE;
  const isRequired = requiredPluginIds.includes(pluginId);
  const installedVersion = installedVersions[pluginId] || null;
  const availableVersion = plugin.spec?.version || null;
  const bundleItems = bundleContent.map((bundlePlugin) =>
    toPluginManagerItem(bundlePlugin, installedVersions, requiredPluginIds),
  );
  const bundleHasUpdate = isBundle && hasBundleUpdate(bundleItems);
  const status = bundleHasUpdate ? 'updateAvailable' : getStatus(installedVersion, availableVersion, isRequired);
  const canInstall = status === 'notInstalled' && !isBundle;
  const canUpdate = status === 'updateAvailable';
  const canDeinstall = !!installedVersion && !canInstall && !isRequired && !isBundle;

  return {
    id: plugin.id || pluginId,
    pluginId,
    name: getPluginName(plugin, pluginId),
    type,
    isBundle,
    isRequired,
    installedVersion,
    availableVersion,
    status,
    canInstall,
    canUpdate,
    canDeinstall,
    documentationUrl: null,
    bundleItems,
    rawPlugin: plugin,
  };
}

export function toPluginManagerItems(
  plugins: Plugin[],
  installedVersions: InstalledPluginVersions,
  requiredPluginIds: string[],
  bundleContentByPluginId: BundleContentByPluginId = {},
): PluginManagerItem[] {
  return plugins.map((plugin) =>
    toPluginManagerItem(plugin, installedVersions, requiredPluginIds, bundleContentByPluginId[getPluginId(plugin)]),
  );
}

export function calculatePluginOverview(
  items: PluginManagerItem[],
  activeAction?: PluginManagerAction | null,
  actionError?: PluginManagerError | null,
): PluginManagerOverview {
  return items.reduce(
    (overview, item) => {
      overview.totalCount += 1;
      overview.installedCount += item.status === 'installed' ? 1 : 0;
      overview.updateCount += item.status === 'updateAvailable' ? 1 : 0;
      overview.notInstalledCount += item.status === 'notInstalled' ? 1 : 0;
      overview.requiredCount += item.status === 'required' ? 1 : 0;
      overview.bundleCount += item.isBundle ? 1 : 0;
      overview.bundleUpdateCount += item.isBundle && item.canUpdate ? 1 : 0;
      return overview;
    },
    {
      totalCount: 0,
      installedCount: 0,
      updateCount: 0,
      notInstalledCount: 0,
      requiredCount: 0,
      bundleCount: 0,
      bundleUpdateCount: 0,
      activeActionCount: activeAction ? 1 : 0,
      failedActionCount: actionError ? 1 : 0,
    },
  );
}

export function filterPluginItems(items: PluginManagerItem[], searchTerm: string): PluginManagerItem[] {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  if (!normalizedSearchTerm) {
    return items;
  }

  return items.filter((item) => {
    return (
      item.name.toLowerCase().includes(normalizedSearchTerm) ||
      item.pluginId.toLowerCase().includes(normalizedSearchTerm)
    );
  });
}

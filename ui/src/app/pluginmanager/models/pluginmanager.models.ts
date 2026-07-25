import { pluginFetchClient } from '@ladon/api';

export type PluginProduct = pluginFetchClient.PluginsProductEnum;
export type PluginChannel = pluginFetchClient.PluginsChannelEnum;

export type PluginManagerStatus =
  | 'installed'
  | 'updateAvailable'
  | 'notInstalled'
  | 'required'
  | 'actionRunning'
  | 'actionFailed';

export type PluginManagerActionType = 'install' | 'update' | 'deinstall' | 'bundleInstall';

export type PluginActionPhase = 'idle' | 'starting' | 'download' | 'upload' | 'finish' | 'rollback' | 'done' | 'error';

export interface ChannelList {
  product: PluginProduct;
  channel: PluginChannel;
}

export interface PluginManagerItem {
  id: string;
  pluginId: string;
  name: string;
  type: string | null;
  isBundle: boolean;
  isRequired: boolean;
  installedVersion: string | null;
  availableVersion: string | null;
  status: PluginManagerStatus;
  canInstall: boolean;
  canUpdate: boolean;
  canDeinstall: boolean;
  documentationUrl: string | null;
  bundleItems: PluginManagerItem[];
  rawPlugin: pluginFetchClient.Plugin;
}

export interface PluginManagerOverview {
  totalCount: number;
  installedCount: number;
  updateCount: number;
  notInstalledCount: number;
  requiredCount: number;
  bundleCount: number;
  bundleUpdateCount: number;
  activeActionCount: number;
  failedActionCount: number;
}

export interface PluginManagerAction {
  pluginId: string;
  actionType: PluginManagerActionType;
  phase: PluginActionPhase;
  progress: number;
  message?: string;
}

export interface PluginManagerError {
  pluginId?: string;
  phase?: PluginActionPhase;
  message: string;
  cause?: unknown;
}

export type InstalledPluginVersions = Record<string, string>;
export type BundleContentByPluginId = Record<string, pluginFetchClient.Plugin[]>;

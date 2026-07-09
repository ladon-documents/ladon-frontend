import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { pluginFetchClient } from '@ladon/api';
import { sortChannels } from '../helper/helper';
import { PluginMetaService } from './plugin-meta.service';
import { FetchApiFactory } from '../../services/api/fetch-api.factory';

type PluginModel = pluginFetchClient.Plugin;

export interface ChannelList {
  product: string;
  channel: string;
}

@Injectable({
  providedIn: 'root',
})
export class PluginService {
  private readonly PLUGIN_DEFAULT_README_PAGE = 'https://ladon.org';

  constructor(
    private apiFactory: FetchApiFactory,
    private pluginMetaService: PluginMetaService,
  ) {}

  loadChannels(): Observable<Array<ChannelList>> {
    return this.pluginMetaService.getPluginConfig().pipe(
      take(1),
      map((config) => {
        if (config && Array.isArray(config) && config.length > 0) {
          return sortChannels([...config]);
        }
        return [];
      }),
    );
  }

  loadPlugins(product: string, channel: string): Observable<Array<PluginModel>> {
    return this.apiFactory.fromApi(() => this.apiFactory.pluginV1Api.plugins({ product, channel: channel as any }));
  }

  loadBundleContent(product: string, channel: string, pluginId: string): Observable<Array<PluginModel>> {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.pluginV1Api.bundleContent({
        product,
        channel: channel as any,
        id: pluginId,
      }),
    );
  }

  loadInstalledVersions(): Observable<Record<string, string>> {
    return this.apiFactory.fromApi(() => this.apiFactory.pluginmanagerApi.installedPlugins());
  }

  loadPluginReadme(product: string, channel: string, pluginId: string): Observable<string> {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.pluginV1Api.pluginReadme({
        product,
        channel: channel as any,
        id: pluginId,
      }),
    );
  }

  resolveDocumentationUrl(product: string, channel: string, pluginId?: string): string {
    if (pluginId) {
      return `https://plugins.mind-consulting.de/plugins/mind/channel/${product}/${channel}/readme/${pluginId}`;
    }
    return this.PLUGIN_DEFAULT_README_PAGE;
  }
}

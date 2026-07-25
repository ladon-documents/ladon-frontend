import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { pluginFetchClient } from '@ladon/api';
import { sortChannels } from '../helper/helper';
import { PluginMetaService } from './plugin-meta.service';
import { FetchApiFactory } from '../../services/api/fetch-api.factory';
import { ChannelList, PluginChannel, PluginProduct } from '../models/pluginmanager.models';

type PluginModel = pluginFetchClient.Plugin;

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

  loadPlugins(product: PluginProduct, channel: PluginChannel): Observable<Array<PluginModel>> {
    return this.apiFactory.fromApi(() => this.apiFactory.pluginV1Api.plugins({ product, channel }));
  }

  loadBundleContent(product: PluginProduct, channel: PluginChannel, pluginId: string): Observable<Array<PluginModel>> {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.pluginV1Api.bundleContent({
        product,
        channel,
        id: pluginId,
      }),
    );
  }

  loadInstalledVersions(): Observable<Record<string, string>> {
    return this.apiFactory.fromApi(() => this.apiFactory.pluginmanagerApi.installedPlugins());
  }

  loadPluginReadme(product: PluginProduct, channel: PluginChannel, pluginId: string): Observable<string> {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.pluginV1Api.pluginReadme({
        product,
        channel,
        id: pluginId,
      }),
    );
  }

  resolveDocumentationUrl(product: PluginProduct, channel: PluginChannel, pluginId?: string): string {
    if (pluginId) {
      return `https://plugins.mind-consulting.de/plugins/mind/channel/${product}/${channel}/readme/${pluginId}`;
    }
    return this.PLUGIN_DEFAULT_README_PAGE;
  }
}

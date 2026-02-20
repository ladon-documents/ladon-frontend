import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { PluginmanagerService } from '@ladon/api';
import { pluginTestMock } from '@ladon/tests/plugin-test-object';

@Injectable({
  providedIn: 'root',
})
export class PluginMetaService {
  private readonly PluginConfigJsonListApiLocal = '/admin/api/rest/v1/content/buckets/_system/jsonlist?';
  private readonly PluginConfigJsonListApi = '/admin/api/rest/v1/content/buckets/_system/jsonlist?';
  private readonly requiredPluginList = [
    'mind/mf-ladon-config',
    'mind/mf-ladon-utility-api',
    'mind/mf-ladon-auth-api',
    'mind/mf-ladon-main-nav',
  ];
  constructor(
    private httpClient: HttpClient,
    private pluginmanagerService: PluginmanagerService,
  ) {}

  public getPluginConfig(): Observable<any> {
    const params = new URLSearchParams();
    params.set('prefix', 'etc/ui/mind/mf-ladon-plugin/config/channels');
    return this.httpClient.get(`${this.PluginConfigJsonListApi}${params}`);
  }

  public pluginCanDeinstalled(pluginId: string): boolean {
    return !!(pluginId && !this.requiredPluginList.includes(pluginId));
  }

  public setVersions(plugins: Array<any>): Observable<Array<any>> {
    try {
      return this.getInstalledPlugins().pipe(
        map((installedPlugins) => {
          const transformedData = plugins.map((item) => {
            if (item && item.pluginId) {
              const installedVersion = installedPlugins[item.pluginId] || null;
              return { ...item, current: installedVersion };
            }
          });
          return this.mapPluginData(transformedData);
        }),
      );
    } catch (e) {
      return of([]);
    }
  }

  private getPluginVersionHistory(): Observable<any> {
    const params = new URLSearchParams();
    params.set('prefix', 'etc/plugins/static-web/mind/');
    return this.httpClient.get(`${this.PluginConfigJsonListApi}${params}`);
  }

  private getInstalledPlugins(): Observable<{ [key: string]: string }> {
    return this.pluginmanagerService.installedPlugins();
  }

  private mapPluginData(data: any[]): Array<any> {
    data.forEach((item) => {
      item.canUpdate = !!(item.current && item.version !== item.current);
      item.canInstall = !!(!item.current && item.current !== item.version);
      item.canDeinstall = !item.canInstall && !this.requiredPluginList.includes(item.pluginId);
    });
    return data;
  }
}

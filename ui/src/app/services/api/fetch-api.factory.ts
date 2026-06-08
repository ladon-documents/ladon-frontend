import { Injectable } from '@angular/core';
import { auth, fetchClient, pluginFetchClient } from '@ladon/api';

const ADMIN_BASE_PATH = '/admin';
const PLUGIN_BASE_PATH = 'https://plugins.mind-consulting.de';

@Injectable({
  providedIn: 'root',
})
export class FetchApiFactory {
  private readonly mainConfiguration = auth.createAuthenticatedConfiguration({
    basePath: ADMIN_BASE_PATH,
  });

  private readonly pluginConfiguration = new pluginFetchClient.Configuration({
    basePath: PLUGIN_BASE_PATH,
    middleware: [auth.createAuthMiddleware({ skipUrls: ['/auth/login'] })],
  });

  readonly authControllerApi = new fetchClient.AuthControllerApi(this.mainConfiguration);
  readonly userControllerApi = new fetchClient.UserControllerApi(this.mainConfiguration);
  readonly documentsApi = new fetchClient.DocumentsApi(this.mainConfiguration);
  readonly converterApi = new fetchClient.ConverterApi(this.mainConfiguration);
  readonly tasksApi = new fetchClient.TasksApi(this.mainConfiguration);
  readonly uiApi = new fetchClient.UIApi(this.mainConfiguration);
  readonly bucketsApi = new fetchClient.BucketsApi(this.mainConfiguration);
  readonly usermanagerApi = new fetchClient.UsermanagerApi(this.mainConfiguration);
  readonly tagmanagerApi = new fetchClient.TagmanagerApi(this.mainConfiguration);
  readonly transactionApi = new fetchClient.TransactionApi(this.mainConfiguration);
  readonly pluginmanagerApi = new fetchClient.PluginmanagerApi(this.mainConfiguration);
  readonly pluginV1Api = new pluginFetchClient.V1Api(this.pluginConfiguration);
}

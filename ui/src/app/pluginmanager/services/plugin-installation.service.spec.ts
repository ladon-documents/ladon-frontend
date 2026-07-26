import { HttpClient, HttpEventType, HttpHeaders, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { pluginFetchClient } from '@ladon/api';
import { from, of } from 'rxjs';
import { FetchApiFactory } from '../../services/api/fetch-api.factory';
import { PluginMetaService } from './plugin-meta.service';
import { PluginInstallationService } from './plugin-installation.service';

type Plugin = pluginFetchClient.Plugin;

function plugin(overrides: Partial<Plugin> = {}): Plugin {
  return {
    id: 'package-id',
    pluginId: 'mind/example-plugin',
    name: 'Example Plugin',
    version: '1.0.0',
    file: 'example-plugin-1.0.0.tgz',
    ...overrides,
  } as Plugin;
}

describe('PluginInstallationService', () => {
  let service: PluginInstallationService;
  let httpClient: jasmine.SpyObj<HttpClient>;
  let apiFactory: jasmine.SpyObj<FetchApiFactory>;
  let transactionApi: jasmine.SpyObj<any>;
  let pluginV1Api: jasmine.SpyObj<any>;
  let documentsApi: jasmine.SpyObj<any>;
  let pluginMetaService: jasmine.SpyObj<PluginMetaService>;

  beforeEach(() => {
    httpClient = jasmine.createSpyObj<HttpClient>('HttpClient', ['post']);
    transactionApi = jasmine.createSpyObj('transactionApi', [
      'startTransaction',
      'commitTransaction',
      'rollbackTransaction',
    ]);
    pluginV1Api = jasmine.createSpyObj('pluginV1Api', ['pluginContentRaw']);
    documentsApi = jasmine.createSpyObj('documentsApi', ['listDocumentJson', 'deleteDocument']);
    apiFactory = jasmine.createSpyObj<FetchApiFactory>('FetchApiFactory', ['fromApi'], {
      transactionApi,
      pluginV1Api,
      documentsApi,
    });
    apiFactory.fromApi.and.callFake((request) => from(request()));
    pluginMetaService = jasmine.createSpyObj<PluginMetaService>('PluginMetaService', ['pluginCanDeinstalled']);
    pluginMetaService.pluginCanDeinstalled.and.returnValue(true);

    TestBed.configureTestingModule({
      providers: [
        PluginInstallationService,
        { provide: HttpClient, useValue: httpClient },
        { provide: FetchApiFactory, useValue: apiFactory },
        { provide: PluginMetaService, useValue: pluginMetaService },
      ],
    });
    service = TestBed.inject(PluginInstallationService);
  });

  it('installs a plugin through transaction, download, upload, and commit', (done) => {
    transactionApi.startTransaction.and.returnValue(Promise.resolve({ txId: 'tx-1' }));
    pluginV1Api.pluginContentRaw.and.returnValue(
      Promise.resolve({
        value: () => Promise.resolve(new Blob(['content'])),
        raw: { headers: new Headers({ 'ladon-plugin-checksum': 'abc' }) },
      }),
    );
    httpClient.post.and.returnValue(of(new HttpResponse({ status: 200, body: {}, headers: new HttpHeaders() })) as any);
    transactionApi.commitTransaction.and.returnValue(Promise.resolve({ success: true }));

    service.installPlugin(plugin(), 'ladon', 'stable').subscribe((state) => {
      expect(state.state).toBe('FINISHED');
      expect(state.progress).toBe(100);
      expect(transactionApi.startTransaction).toHaveBeenCalled();
      expect(pluginV1Api.pluginContentRaw).toHaveBeenCalledWith({
        product: 'ladon',
        channel: 'stable' as any,
        id: 'package-id',
      });
      expect(httpClient.post).toHaveBeenCalled();
      expect(transactionApi.commitTransaction).toHaveBeenCalledWith({ txId: 'tx-1' });
      done();
    });
  });

  it('rolls back when download fails', (done) => {
    transactionApi.startTransaction.and.returnValue(Promise.resolve({ txId: 'tx-1' }));
    pluginV1Api.pluginContentRaw.and.returnValue(Promise.reject(new Error('download failed')));
    transactionApi.rollbackTransaction.and.returnValue(Promise.resolve({ success: true }));

    service.installPlugin(plugin(), 'ladon', 'stable').subscribe({
      next: () => fail('install should fail'),
      error: (state) => {
        expect(state.state).toBe('ERROR');
        expect(state.mode).toBe('DOWNLOAD');
        expect(transactionApi.rollbackTransaction).toHaveBeenCalledWith({ txId: 'tx-1' });
        done();
      },
    });
  });

  it('rolls back when commit fails', (done) => {
    transactionApi.startTransaction.and.returnValue(Promise.resolve({ txId: 'tx-1' }));
    pluginV1Api.pluginContentRaw.and.returnValue(
      Promise.resolve({
        value: () => Promise.resolve(new Blob(['content'])),
        raw: { headers: new Headers() },
      }),
    );
    httpClient.post.and.returnValue(of({ type: HttpEventType.Response, body: {} }) as any);
    transactionApi.commitTransaction.and.returnValue(Promise.resolve({ success: false }));
    transactionApi.rollbackTransaction.and.returnValue(Promise.resolve({ success: true }));

    service.installPlugin(plugin(), 'ladon', 'stable').subscribe({
      next: () => fail('install should fail'),
      error: (state) => {
        expect(state.state).toBe('ERROR');
        expect(state.mode).toBe('FINISH');
        expect(transactionApi.rollbackTransaction).toHaveBeenCalledWith({ txId: 'tx-1' });
        done();
      },
    });
  });

  it('deinstalls the newest static-web plugin document', (done) => {
    documentsApi.listDocumentJson.and.returnValue(Promise.resolve([{ changetoken: 'latest-token' }]));
    documentsApi.deleteDocument.and.returnValue(Promise.resolve({}));

    service.deinstallPlugin(plugin()).subscribe((state) => {
      expect(state.state).toBe('FINISHED');
      expect(documentsApi.deleteDocument).toHaveBeenCalledWith({
        bucket: '_system',
        key: 'etc/plugins/static-web/mind/example-plugin/latest-token.json',
      });
      done();
    });
  });

  it('rejects required plugin deinstall before deleting documents', (done) => {
    pluginMetaService.pluginCanDeinstalled.and.returnValue(false);

    service.deinstallPlugin(plugin()).subscribe({
      next: () => fail('deinstall should fail'),
      error: (state) => {
        expect(state.state).toBe('ERROR');
        expect(documentsApi.deleteDocument).not.toHaveBeenCalled();
        done();
      },
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { from, of } from 'rxjs';

import { PluginService } from './plugin.service';
import { PluginMetaService } from './plugin-meta.service';
import { FetchApiFactory } from '../../services/api/fetch-api.factory';

describe('PluginService', () => {
  let service: PluginService;
  let apiFactory: jasmine.SpyObj<FetchApiFactory>;
  let pluginV1Api: jasmine.SpyObj<any>;
  let pluginmanagerApi: jasmine.SpyObj<any>;
  let pluginMetaService: jasmine.SpyObj<PluginMetaService>;

  const channels = [
    { product: 'ladon', channel: 'beta' },
    { product: 'ladon', channel: 'stable' },
  ];

  beforeEach(() => {
    pluginV1Api = jasmine.createSpyObj('pluginV1Api', ['plugins', 'bundleContent', 'pluginReadme']);
    pluginmanagerApi = jasmine.createSpyObj('pluginmanagerApi', ['installedPlugins']);
    apiFactory = jasmine.createSpyObj<FetchApiFactory>('FetchApiFactory', ['fromApi'], {
      pluginV1Api,
      pluginmanagerApi,
    });
    apiFactory.fromApi.and.callFake((request) => from(request()));

    pluginMetaService = jasmine.createSpyObj<PluginMetaService>('PluginMetaService', [
      'getPluginConfig',
      'pluginCanDeinstalled',
      'setVersions',
    ]);
    pluginMetaService.getPluginConfig.and.returnValue(of(channels));

    TestBed.configureTestingModule({
      providers: [
        PluginService,
        { provide: HttpClient, useValue: jasmine.createSpyObj<HttpClient>('HttpClient', ['post']) },
        { provide: FetchApiFactory, useValue: apiFactory },
        { provide: PluginMetaService, useValue: pluginMetaService },
      ],
    });
    service = TestBed.inject(PluginService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('loads sorted plugin channels without exposing component state', (done) => {
    service.loadChannels().subscribe((result) => {
      expect(result.map((item) => item.channel)).toEqual(['stable', 'beta']);
      expect(pluginMetaService.getPluginConfig).toHaveBeenCalled();
      done();
    });
  });

  it('loads plugins for product and channel', (done) => {
    const plugins = [{ id: 'plugin-id', pluginId: 'mind/plugin' }] as any;
    pluginV1Api.plugins.and.returnValue(Promise.resolve(plugins));

    service.loadPlugins('ladon', 'stable').subscribe((result) => {
      expect(result).toBe(plugins);
      expect(pluginV1Api.plugins).toHaveBeenCalledWith({
        product: 'ladon',
        channel: 'stable' as any,
      });
      done();
    });
  });

  it('loads bundle content for product, channel, and plugin id', (done) => {
    const bundleContent = [{ id: 'contained-plugin', pluginId: 'mind/contained-plugin' }] as any;
    pluginV1Api.bundleContent.and.returnValue(Promise.resolve(bundleContent));

    service.loadBundleContent('ladon', 'beta', 'bundle-id').subscribe((result) => {
      expect(result).toBe(bundleContent);
      expect(pluginV1Api.bundleContent).toHaveBeenCalledWith({
        product: 'ladon',
        channel: 'beta' as any,
        id: 'bundle-id',
      });
      done();
    });
  });

  it('loads installed plugin versions', (done) => {
    const installedVersions = { 'mind/plugin': '1.0.0' };
    pluginmanagerApi.installedPlugins.and.returnValue(Promise.resolve(installedVersions));

    service.loadInstalledVersions().subscribe((result) => {
      expect(result).toEqual(installedVersions);
      expect(pluginmanagerApi.installedPlugins).toHaveBeenCalled();
      done();
    });
  });

  it('loads plugin readme for product, channel, and plugin id', (done) => {
    pluginV1Api.pluginReadme.and.returnValue(Promise.resolve('# Readme'));

    service.loadPluginReadme('ladon', 'stable', 'plugin-id').subscribe((result) => {
      expect(result).toBe('# Readme');
      expect(pluginV1Api.pluginReadme).toHaveBeenCalledWith({
        product: 'ladon',
        channel: 'stable' as any,
        id: 'plugin-id',
      });
      done();
    });
  });

  it('resolves documentation urls', () => {
    expect(service.resolveDocumentationUrl('ladon', 'stable', 'plugin-id')).toBe(
      'https://plugins.mind-consulting.de/plugins/mind/channel/ladon/stable/readme/plugin-id',
    );
    expect(service.resolveDocumentationUrl('ladon', 'stable')).toBe('https://ladon.org');
  });
});

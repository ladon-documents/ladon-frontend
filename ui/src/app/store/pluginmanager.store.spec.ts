import { TestBed } from '@angular/core/testing';
import { pluginFetchClient } from '@ladon/api';
import { of, throwError } from 'rxjs';
import { PluginInstallationService } from '../pluginmanager/services/plugin-installation.service';
import { PluginService } from '../pluginmanager/services/plugin.service';
import { ToastService } from '../shared/services/toast.service';
import { PluginManagerStore } from './pluginmanager.store';

type Plugin = pluginFetchClient.Plugin;

function plugin(overrides: Partial<Plugin> = {}): Plugin {
  return {
    id: 'package-id',
    pluginId: 'mind/example-plugin',
    name: 'Example Plugin',
    version: '1.0.0',
    file: 'example-plugin-1.0.0.tgz',
    spec: { type: 'static-web', id: 'mind/example-plugin', name: 'Example Plugin' },
    ...overrides,
  } as Plugin;
}

describe('PluginManagerStore', () => {
  let store: InstanceType<typeof PluginManagerStore>;
  let pluginService: jasmine.SpyObj<PluginService>;
  let installationService: jasmine.SpyObj<PluginInstallationService>;
  let toastService: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    pluginService = jasmine.createSpyObj<PluginService>('PluginService', [
      'loadChannels',
      'loadPlugins',
      'loadInstalledVersions',
      'loadBundleContent',
      'resolveDocumentationUrl',
    ]);
    pluginService.loadChannels.and.returnValue(
      of([
        { product: 'ladon', channel: 'stable' },
        { product: 'ladon', channel: 'beta' },
      ]),
    );
    pluginService.loadPlugins.and.returnValue(of([plugin()]));
    pluginService.loadInstalledVersions.and.returnValue(of({ 'mind/example-plugin': '1.0.0' }));
    pluginService.loadBundleContent.and.returnValue(of([]));
    pluginService.resolveDocumentationUrl.and.callFake(
      (product, channel, pluginId) => `https://docs.example/${product}/${channel}/${pluginId}`,
    );

    installationService = jasmine.createSpyObj<PluginInstallationService>('PluginInstallationService', [
      'installPlugin',
      'deinstallPlugin',
    ]);
    installationService.installPlugin.and.returnValue(
      of({
        progress: 100,
        mode: 'UPLOAD',
        state: 'FINISHED',
        content: null,
        plugin: plugin(),
      }),
    );
    installationService.deinstallPlugin.and.returnValue(
      of({
        progress: 100,
        mode: 'DEINSTALL',
        state: 'FINISHED',
        content: null,
        plugin: plugin(),
      }),
    );

    toastService = jasmine.createSpyObj<ToastService>('ToastService', ['error', 'success']);

    TestBed.configureTestingModule({
      providers: [
        PluginManagerStore,
        { provide: PluginService, useValue: pluginService },
        { provide: PluginInstallationService, useValue: installationService },
        { provide: ToastService, useValue: toastService },
      ],
    });
    store = TestBed.inject(PluginManagerStore);
  });

  it('starts with empty feature state', () => {
    expect(store.channels()).toEqual([]);
    expect(store.items()).toEqual([]);
    expect(store.selectedPluginId()).toBeNull();
    expect(store.searchTerm()).toBe('');
    expect(store.activeAction()).toBeNull();
  });

  it('initializes with a valid route channel', () => {
    store.initialize('beta');

    expect(store.activeChannel()).toBe('beta');
    expect(store.normalizedChannel()).toBeNull();
    expect(pluginService.loadPlugins).toHaveBeenCalledWith('ladon', 'beta');
  });

  it('normalizes an invalid route channel to the first API channel', () => {
    store.initialize('nightly');

    expect(store.activeChannel()).toBe('stable');
    expect(store.normalizedChannel()).toBe('stable');
  });

  it('clears selection and errors when changing channel', () => {
    store.initialize('stable');
    store.selectPlugin('mind/example-plugin');
    store.setActionError({ pluginId: 'mind/example-plugin', message: 'Failed' });

    store.changeChannel('beta');

    expect(store.selectedPluginId()).toBeNull();
    expect(store.actionError()).toBeNull();
    expect(store.activeChannel()).toBe('beta');
  });

  it('filters items locally', () => {
    pluginService.loadPlugins.and.returnValue(
      of([
        plugin({ pluginId: 'mind/documents', name: 'Documents' }),
        plugin({ pluginId: 'mind/user-manager', name: 'User Manager' }),
      ]),
    );

    store.initialize('stable');
    store.setSearchTerm('user');

    expect(store.filteredItems().map((item) => item.pluginId)).toEqual(['mind/user-manager']);
  });

  it('keeps selection after a successful action reload when plugin still exists', () => {
    store.initialize('stable');
    store.selectPlugin('mind/example-plugin');

    store.runPluginAction({
      item: store.selectedPlugin()!,
      actionType: 'update',
    });

    expect(store.selectedPluginId()).toBe('mind/example-plugin');
    expect(store.activeAction()).toBeNull();
    expect(pluginService.loadPlugins).toHaveBeenCalledTimes(2);
  });

  it('stores contextual action errors and triggers a toast', () => {
    installationService.installPlugin.and.returnValue(
      throwError(() => ({
        state: 'ERROR',
        mode: 'DOWNLOAD',
        progress: 0,
        content: null,
        plugin: plugin(),
      })),
    );

    store.initialize('stable');
    store.runPluginAction({
      item: store.items()[0],
      actionType: 'update',
    });

    expect(store.actionError()?.pluginId).toBe('mind/example-plugin');
    expect(toastService.error).toHaveBeenCalled();
  });

  it('blocks a second action while an action is active', () => {
    store.initialize('stable');
    store.setActiveAction({
      pluginId: 'mind/example-plugin',
      actionType: 'update',
      phase: 'download',
      progress: 50,
    });

    store.runPluginAction({
      item: store.items()[0],
      actionType: 'update',
    });

    expect(installationService.installPlugin).not.toHaveBeenCalled();
  });
});

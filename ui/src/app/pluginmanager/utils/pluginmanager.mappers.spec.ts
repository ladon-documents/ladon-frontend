import { pluginFetchClient } from '@ladon/api';
import {
  calculatePluginOverview,
  filterPluginItems,
  toPluginManagerItem,
  toPluginManagerItems,
} from './pluginmanager.mappers';

type Plugin = pluginFetchClient.Plugin;

function plugin(overrides: Partial<Plugin> = {}): Plugin {
  return {
    id: 'plugin-package-id',
    pluginId: 'mind/example-plugin',
    name: 'Example Plugin',
    version: '1.0.0',
    file: 'example-plugin-1.0.0.tgz',
    type: 'static-web',
    spec: {
      type: 'static-web',
      id: 'mind/example-plugin',
      name: 'Example Plugin',
    },
    ...overrides,
  } as Plugin;
}

describe('pluginmanager mappers', () => {
  const requiredPluginIds = ['mind/required-plugin'];

  it('maps an installed plugin when current and available versions match', () => {
    const item = toPluginManagerItem(plugin(), { 'mind/example-plugin': '1.0.0' }, requiredPluginIds);

    expect(item.status).toBe('installed');
    expect(item.installedVersion).toBe('1.0.0');
    expect(item.availableVersion).toBe('1.0.0');
    expect(item.canInstall).toBeFalse();
    expect(item.canUpdate).toBeFalse();
    expect(item.canDeinstall).toBeTrue();
  });

  it('maps an update when an installed version differs from the available version', () => {
    const item = toPluginManagerItem(
      plugin({ version: '1.2.0' }),
      { 'mind/example-plugin': '1.0.0' },
      requiredPluginIds,
    );

    expect(item.status).toBe('updateAvailable');
    expect(item.installedVersion).toBe('1.0.0');
    expect(item.availableVersion).toBe('1.2.0');
    expect(item.canInstall).toBeFalse();
    expect(item.canUpdate).toBeTrue();
    expect(item.canDeinstall).toBeTrue();
  });

  it('maps a not installed plugin', () => {
    const item = toPluginManagerItem(plugin(), {}, requiredPluginIds);

    expect(item.status).toBe('notInstalled');
    expect(item.installedVersion).toBeNull();
    expect(item.availableVersion).toBe('1.0.0');
    expect(item.canInstall).toBeTrue();
    expect(item.canUpdate).toBeFalse();
    expect(item.canDeinstall).toBeFalse();
  });

  it('prevents required plugins from being deinstalled', () => {
    const item = toPluginManagerItem(
      plugin({
        pluginId: 'mind/required-plugin',
        spec: {
          type: 'static-web',
          id: 'mind/required-plugin',
          name: 'Required Plugin',
        },
      }),
      { 'mind/required-plugin': '1.0.0' },
      requiredPluginIds,
    );

    expect(item.status).toBe('required');
    expect(item.isRequired).toBeTrue();
    expect(item.canDeinstall).toBeFalse();
  });

  it('marks web-bundle plugins and maps bundle content', () => {
    const bundle = plugin({
      id: 'bundle-package-id',
      pluginId: 'mind/plugin-bundle',
      name: 'Plugin Bundle',
      version: '2.0.0',
      spec: {
        type: 'web-bundle',
        id: 'mind/plugin-bundle',
        name: 'Plugin Bundle',
      },
    });
    const containedPlugin = plugin({
      pluginId: 'mind/contained-plugin',
      name: 'Contained Plugin',
      version: '1.1.0',
    });

    const item = toPluginManagerItem(bundle, { 'mind/contained-plugin': '1.0.0' }, requiredPluginIds, [
      containedPlugin,
    ]);

    expect(item.isBundle).toBeTrue();
    expect(item.bundleItems.length).toBe(1);
    expect(item.bundleItems[0].status).toBe('updateAvailable');
    expect(item.canUpdate).toBeTrue();
  });

  it('calculates overview counts', () => {
    const items = toPluginManagerItems(
      [
        plugin({ pluginId: 'mind/installed', version: '1.0.0' }),
        plugin({ pluginId: 'mind/update', version: '2.0.0' }),
        plugin({ pluginId: 'mind/new', version: '1.0.0' }),
        plugin({
          pluginId: 'mind/bundle',
          version: '1.0.0',
          spec: { type: 'web-bundle', id: 'mind/bundle', name: 'Bundle' },
        }),
      ],
      {
        'mind/installed': '1.0.0',
        'mind/update': '1.0.0',
      },
      requiredPluginIds,
      {
        'mind/bundle': [plugin({ pluginId: 'mind/bundled-update', version: '2.0.0' })],
      },
    );

    const overview = calculatePluginOverview(items);

    expect(overview.installedCount).toBe(1);
    expect(overview.updateCount).toBe(2);
    expect(overview.notInstalledCount).toBe(1);
    expect(overview.bundleUpdateCount).toBe(1);
  });

  it('filters plugin items locally by name and plugin id case-insensitively', () => {
    const items = toPluginManagerItems(
      [
        plugin({ pluginId: 'mind/documents', name: 'Documents' }),
        plugin({ pluginId: 'mind/user-manager', name: 'User Manager' }),
      ],
      {},
      requiredPluginIds,
    );

    expect(filterPluginItems(items, 'USER')).toEqual([items[1]]);
    expect(filterPluginItems(items, 'documents')).toEqual([items[0]]);
    expect(filterPluginItems(items, 'mind/user')).toEqual([items[1]]);
    expect(filterPluginItems(items, '')).toEqual(items);
  });
});

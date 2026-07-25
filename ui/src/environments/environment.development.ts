import packageJson from '../../../package.json';
import type { WebComponentLoaderOptions } from '@ladon/utility';

const baseHref = 'ui/draco/ladon-core';

const webComponents: WebComponentLoaderOptions = {
  source: 'local',
  local: {
    basePath: '/public/dev-wc',
    manifestPath: '/public/dev-wc/manifest.json',
  },
};

const rapids = {
  source: 'local',
  bucket: 'draco-rapids',
  trustedExecutionEnabled: true,
  local: {
    basePath: `/${baseHref}/public/dev-rapids`,
    manifestPath: `/${baseHref}/public/dev-rapids/rapid-pages.json`,
  },
};

export const environment = {
  version: packageJson.version,
  anonymousAccess: true,
  navigation: [],
  eventSource: false,
  favicon: '/ui/root/assets/favicon.ico',
  appTitle: 'Ladon Documents Test System',
  logger: 'ALL',
  baseHref,
  media: {
    fileLimit: 167777216,
    acceptedFiles: ['jpg', 'jpeg', 'png', 'pdf'],
  },
  webComponents,
  rapids,
  storage: 'sessionStorage',
  production: false,
};

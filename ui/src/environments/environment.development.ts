import packageJson from '../../../package.json';
import type { WebComponentLoaderOptions } from '@utility';

const webComponents: WebComponentLoaderOptions = {
  source: 'local',
  local: {
    basePath: '/public/dev-wc',
    manifestPath: '/public/dev-wc/manifest.json',
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
  baseHref: 'ui/draco/ladon-core',
  media: {
    fileLimit: 167777216,
    acceptedFiles: ['jpg', 'jpeg', 'png', 'pdf'],
  },
  webComponents,
  storage: 'sessionStorage',
  production: false,
};

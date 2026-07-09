import packageJson from '../../../package.json';
import type { WebComponentLoaderOptions } from '@ladon/utility';

const webComponents: WebComponentLoaderOptions = {
  source: 'server',
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
  statics: {
    source: 'server',
    bucket: 'draco-statics',
    trustedExecutionEnabled: false,
  },
  storage: 'sessionStorage',
  production: true,
};

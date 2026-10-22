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
  rapids: {
    source: 'server',
    bucket: 'draco-rapids',
    // Deny untrusted rapid script execution by default (production / fallback
    // env). Local dev rapids opt back in via environment.development.ts. This is
    // the secure default the app.config.spec enforces (provider must be `false`).
    trustedExecutionEnabled: false,
  },
  storage: 'sessionStorage',
  production: true,
};

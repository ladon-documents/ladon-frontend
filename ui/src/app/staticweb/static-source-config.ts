import { InjectionToken } from '@angular/core';

import { environment } from '../../environments/environment';

export type StaticSourceConfig =
  | {
      source: 'server';
      bucket?: 'draco-statics';
      trustedExecutionEnabled?: boolean;
    }
  | {
      source: 'local';
      bucket?: 'draco-statics';
      trustedExecutionEnabled?: boolean;
      local: {
        basePath: string;
        manifestPath?: string;
      };
    };

const DEFAULT_STATIC_SOURCE_CONFIG: StaticSourceConfig = {
  source: 'server',
  bucket: 'draco-statics',
};

export const STATIC_SOURCE_CONFIG = new InjectionToken<StaticSourceConfig>('STATIC_SOURCE_CONFIG', {
  providedIn: 'root',
  factory: () => (environment.statics as StaticSourceConfig | undefined) ?? DEFAULT_STATIC_SOURCE_CONFIG,
});

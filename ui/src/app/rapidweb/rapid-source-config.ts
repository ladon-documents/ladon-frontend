import { InjectionToken } from '@angular/core';

import { environment } from '../../environments/environment';

export type RapidSourceConfig =
  | {
      source: 'server';
      bucket?: 'draco-rapids';
      trustedExecutionEnabled?: boolean;
    }
  | {
      source: 'local';
      bucket?: 'draco-rapids';
      trustedExecutionEnabled?: boolean;
      local: {
        basePath: string;
        manifestPath?: string;
      };
    };

const DEFAULT_RAPID_SOURCE_CONFIG: RapidSourceConfig = {
  source: 'server',
  bucket: 'draco-rapids',
};

export const RAPID_SOURCE_CONFIG = new InjectionToken<RapidSourceConfig>('RAPID_SOURCE_CONFIG', {
  providedIn: 'root',
  factory: () => (environment.rapids as RapidSourceConfig | undefined) ?? DEFAULT_RAPID_SOURCE_CONFIG,
});

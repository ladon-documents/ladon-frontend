import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { appRoutes } from './app.routes';

import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideNgIconsConfig } from '@ng-icons/core';
import { APP_BASE_HREF } from '@angular/common';
import { LadonApiModule, Configuration, ConfigurationParameters } from '../api/';
import { LadonApiModule as PluginApiModule } from '../plugin';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function apiConfigFactory(): Configuration {
  const params: ConfigurationParameters = {
    basePath: '/admin',
  };
  return new Configuration(params);
}

export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgIconsConfig({
      size: '1.5em',
      color: 'darkblue',
    }),
    { provide: APP_BASE_HREF, useValue: '/' },
    provideHttpClient(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes, withComponentInputBinding()),
    importProvidersFrom(LadonApiModule.forRoot(apiConfigFactory)),
    importProvidersFrom(PluginApiModule),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      }),
    ),
  ],
};

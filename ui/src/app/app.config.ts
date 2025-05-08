import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { appRoutes } from './app.routes';

import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNgIconsConfig } from '@ng-icons/core';
import { APP_BASE_HREF } from '@angular/common';
import { LadonApiModule, Configuration, ConfigurationParameters } from '../api/';
import {
  LadonApiModule as PluginApiModule,
  Configuration as PluginApiConfiguration,
  ConfigurationParameters as PluginApiConfigurationParameters,
} from '../plugin';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { tokenInterceptor } from './interceptors/token.interceptor';

export function apiConfigFactory(): Configuration {
  const params: ConfigurationParameters = {
    basePath: '/admin',
  };
  return new Configuration(params);
}
export function pluginApiConfigFactory(): PluginApiConfiguration {
  const params: PluginApiConfigurationParameters = {
    basePath: '/plugins',
  };
  return new PluginApiConfiguration(params);
}

export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, './public/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgIconsConfig({
      size: '1.5em',
      color: 'darkblue',
    }),
    { provide: APP_BASE_HREF, useValue: '/' },
    provideHttpClient(withInterceptors([tokenInterceptor])),
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

import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import {
  provideRouter,
  UrlSerializer,
  withComponentInputBinding,
  withDebugTracing,
  withRouterConfig,
  withViewTransitions,
} from '@angular/router';
import { appRoutes } from './app.routes';

import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNgIconsConfig } from '@ng-icons/core';
import { APP_BASE_HREF } from '@angular/common';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { tokenInterceptor } from './interceptors/token.interceptor';
import { CustomUrlSerializer } from './app.navconfig';
import { STATIC_TRUSTED_EXECUTION_ENABLED } from './staticweb/static-trust-boundary.service';
import { environment } from '../environments/environment';

export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, './public/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgIconsConfig({
      size: '1.5em',
    }),
    { provide: UrlSerializer, useClass: CustomUrlSerializer },

    { provide: APP_BASE_HREF, useValue: '/' },
    { provide: STATIC_TRUSTED_EXECUTION_ENABLED, useValue: environment.statics.trustedExecutionEnabled === true },
    provideHttpClient(withInterceptors([tokenInterceptor])),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withViewTransitions(),
      withDebugTracing(),
      withRouterConfig({
        paramsInheritanceStrategy: 'always',
        onSameUrlNavigation: 'reload',
      }),
    ),
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

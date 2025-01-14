import {ApplicationConfig, importProvidersFrom, provideZoneChangeDetection} from "@angular/core";
import {provideRouter, withComponentInputBinding} from "@angular/router";
import {appRoutes} from "./app.routes";

import {provideHttpClient} from "@angular/common/http";
import {provideNgIconsConfig} from "@ng-icons/core";
import {APP_BASE_HREF} from "@angular/common";
import {ApiModule, Configuration, ConfigurationParameters} from "./services/ladon-api";

export function apiConfigFactory(): Configuration {
  const params: ConfigurationParameters = {
    basePath: "/admin",
    // set configuration parameters here.
  };
  return new Configuration(params);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgIconsConfig({
      size: "1.5em",
      color: "darkblue",
    }),
    {provide: APP_BASE_HREF, useValue: '/'},
    provideHttpClient(),
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(appRoutes, withComponentInputBinding()),
    importProvidersFrom(ApiModule.forRoot(apiConfigFactory)),
  ],
};

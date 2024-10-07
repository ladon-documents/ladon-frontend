import {ApplicationConfig, importProvidersFrom, provideZoneChangeDetection} from "@angular/core";
import {provideRouter} from "@angular/router";
import {appRoutes} from "./app.routes";

import {
  ApiModule,
  Configuration,
  ConfigurationParameters
} from "ladon-api";
import {provideHttpClient} from "@angular/common/http";

export function apiConfigFactory(): Configuration {
  const params: ConfigurationParameters = {
    basePath: 'http://localhost:8080'
    // set configuration parameters here.
  }
  return new Configuration(params);
}



export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(appRoutes),
    importProvidersFrom(
        ApiModule.forRoot(apiConfigFactory)
    )
  ],
};

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppAngularBComponent } from './app/app.component';

bootstrapApplication(AppAngularBComponent, appConfig)
  .catch((err) => console.error(err));

import { Routes } from '@angular/router';
import { PluginmanagerComponent } from './pluginmanager.component';

export const pluginmanagerRoutes: Routes = [
  {
    path: '',
    component: PluginmanagerComponent,
  },
  {
    path: ':channelName',
    component: PluginmanagerComponent,
  },
];

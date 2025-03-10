import {Routes} from "@angular/router";
import {PluginmanagerComponent} from "./pluginmanager.component";
import {PluginListComponent} from "./plugin-list/plugin-list.component";

export const pluginmanagerRoutes: Routes = [
  {
    path: '',
    component: PluginmanagerComponent,
    children: [
      {
        path: ':channelName',
        component: PluginListComponent,
      },
    ],
  },
];

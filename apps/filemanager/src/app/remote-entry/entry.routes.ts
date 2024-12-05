import {Route} from "@angular/router";
import {RemoteEntryComponent} from "./entry.component";

export const remoteRoutes: Route[] = [
  {path: "ui/draco/apps/filemanager/", component: RemoteEntryComponent},
  {path: '', redirectTo: `ui/draco/apps/filemanager/`, pathMatch: "full"},
];

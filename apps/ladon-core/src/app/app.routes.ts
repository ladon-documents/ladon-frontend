import { NxWelcomeComponent } from "./nx-welcome.component";
import { Route } from "@angular/router";
import {loadRemoteModule} from "@nx/angular/mf";
import {UsermanagerComponent} from "./usermanager/usermanager.component";

export const appRoutes: Route[] = [
	 {
	 	path: "filemanager",
	 	loadChildren: () =>
	 			loadRemoteModule('filemanager', './Routes').then((m) => m.remoteRoutes),
	 },
	{
		path: "usermanager",
		component: UsermanagerComponent,
	},
	{
		path: "",
		component: NxWelcomeComponent,
	},
];

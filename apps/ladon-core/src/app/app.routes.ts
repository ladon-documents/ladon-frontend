import { Route } from "@angular/router";
import { loadRemoteModule } from "@nx/angular/mf";
import { Component } from "@angular/core";
import { environment } from "@ladon/environment";
import { setNavigation } from "./app.navconfig";
import {LoginComponent} from "login";
import {AuthGuard} from "../../../../libs/shared/ng/ladon-auth/src/lib/guards/auth/auth.guard";

const NO_ROUTING_TARGETS = ["action", "external"];

export const setNavigationDefinitions = (navigation: Array<any>) => {
	setNavigation();

	const _appRoutes: any = [];
	_appRoutes.push(
			{ path: 'login', component: LoginComponent }
	);
	navigation.forEach((navItem) => {
		if (NO_ROUTING_TARGETS.includes(navItem.target)) return;
		const data: any = {
			path: navItem.path,
			canActivate: [AuthGuard]
		};
		if (navItem.target === "remote") {
			data.loadChildren = () => loadRemoteModule(navItem.path, "./Routes").then((m) => m.remoteRoutes);
		} else {
			const compName = (navItem.component.charAt(0).toUpperCase() +
				navItem.component.slice(1) +
				"Component") as keyof typeof Component;
			data.loadComponent = () =>
				import("./" + navItem.component + "/" + navItem.component + ".component").then((m) => m[compName]);
		}
		_appRoutes.push(data);
	});
	return _appRoutes;
};
export const appRoutes: Route[] = setNavigationDefinitions(environment.navigation);

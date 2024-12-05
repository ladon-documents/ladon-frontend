import { Route } from "@angular/router";
import { loadRemoteModule } from "@nx/angular/mf";
import { Component } from "@angular/core";
import { environment } from "@ladon/environment";
import { setNavigation } from "./app.navconfig";
import {AuthGuard} from "@ladon/auth-guard";
import {LoginComponent} from "@ladon/login";
import {EmptyRouteComponent} from "./app.component";

const NO_ROUTING_TARGETS = ["action", "external"];

export const setNavigationDefinitions = (navigation: Array<any>) => {
	setNavigation();

	const _appRoutes: any = [];
	_appRoutes.push(
			{ path: `${environment.baseHref}/login`, component: LoginComponent },
			{ path: '', redirectTo: `${environment.baseHref}/login`, pathMatch: "full" },
);
	navigation.forEach((navItem) => {
		if (NO_ROUTING_TARGETS.includes(navItem.target)) return;
		const navPath = `${environment.baseHref}/${navItem.path}`;
		const data: any = {
			path: navPath,
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
	_appRoutes.push(		{ path: '**', component: EmptyRouteComponent },
	)
	return _appRoutes;
};
export const appRoutes: Route[] = setNavigationDefinitions(environment.navigation);

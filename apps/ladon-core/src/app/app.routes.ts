import { Route } from "@angular/router";
import { loadRemoteModule } from "@nx/angular/mf";
import { Component } from "@angular/core";
import { environment } from "@ladon/environment";

export const setNavigationDefinitions = (navigation: Array<any>) => {
	const _appRoutes: any = [];
	navigation.forEach((navItem) => {
		const data: any = {
			path: navItem.path,
		};
		if (navItem.target === 'remote') {
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

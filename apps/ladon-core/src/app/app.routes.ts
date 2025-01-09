import {Route} from "@angular/router";
import {Component} from "@angular/core";
import {environment} from "@ladon/environment";
import {setNavigation} from "./app.navconfig";
import {AuthGuard} from "@ladon/auth-guard";
import {LoginComponent} from "@ladon/login";
import {EmptyRouteComponent} from "./app.component";

const NO_ROUTING_TARGETS = ["action", "external"];
import {loadRemoteModule} from '@angular-architects/module-federation';
import {StaticwebComponent} from "@staticweb";

export const setNavigationDefinitions = (navigation: Array<any>) => {
  setNavigation();

  const _appRoutes: any = [];
  _appRoutes.push(
      {path: `${environment.baseHref}/login`, component: LoginComponent},
      {path: '', redirectTo: `${environment.baseHref}/login`, pathMatch: "full"},
      {
        path: `${environment.baseHref}/static`,
        component: StaticwebComponent,
        canActivate: [AuthGuard]},
      {path: `${environment.baseHref}/static/:htmlId`, component: StaticwebComponent},
  );
  navigation.forEach((navItem) => {
    if (NO_ROUTING_TARGETS.includes(navItem.target)) return;

    const navPath = `${environment.baseHref}/${navItem.path}`;
    const data: any = {
      path: navPath,
      canActivate: [AuthGuard]
    };

    switch (navItem.target) {
      case "internal": {
        const compName = (navItem.component.charAt(0).toUpperCase() +
            navItem.component.slice(1) +
            "Component") as keyof typeof Component;
        data.loadComponent = () =>
            import("./apps/" +navItem.component + "/" + navItem.component + ".component").then((m) => m[compName]);
        break;
      }
      case "remote": {
        //data.loadChildren = () => loadRemoteModule(navItem.path, "./Routes").then((m) => m.remoteRoutes);
        data.loadChildren = () => loadRemoteModule(
            {
              type: 'manifest',
              remoteName: navItem.path, //'http://localhost:4201/remoteEntry.js',
              exposedModule: navItem.exposedModule, //'./routes'
            }
        ).then((m => m!.remoteRoutes))
        break;
      }
      case "static": {
        //  data.path = `${environment.baseHref}/static/${navItem.path}`;
      }
    }
    if (navItem.target !== "static") {
      _appRoutes.push(data);
    }
  });
  _appRoutes.push({path: '**', component: EmptyRouteComponent},
  )
  return _appRoutes;
};
export const appRoutes: Route[] = setNavigationDefinitions(environment.navigation);

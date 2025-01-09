import {Route} from "@angular/router";
import {Component} from "@angular/core";
import {EmptyRouteComponent} from "./app.component";

const NO_ROUTING_TARGETS = ["action", "external"];
import {LoginComponent} from "./login/login.component";
import {environment} from "../environments/environment";
import {setNavigation} from "./app.navconfig";
import {StaticwebComponent} from "./staticweb/staticweb.component";
import {AuthGuard} from "./shared/guards/auth/auth.guard";

export const setNavigationDefinitions = (navigation: Array<any>) => {
  setNavigation();

  const _appRoutes: any = [];
  _appRoutes.push(
      {path: `${environment.baseHref}/login`, component: LoginComponent},
      {path: environment.baseHref, redirectTo: `${environment.baseHref}/login`, pathMatch: "full"},
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
    const compName = (navItem.component.charAt(0).toUpperCase() +
        navItem.component.slice(1) +
        "Component") as keyof typeof Component;
    data.loadComponent = () =>
        import("./" + navItem.component + "/" + navItem.component + ".component.ts").then((m) => m[compName]);
    if (navItem.target !== "static") {
      _appRoutes.push(data);
    }
  });
  _appRoutes.push({path: '**', component: EmptyRouteComponent},
  )
  return _appRoutes;
};
export const appRoutes: Route[] = setNavigationDefinitions(environment.navigation);

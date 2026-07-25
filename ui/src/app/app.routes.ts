import { Route, Routes } from '@angular/router';
import { Component } from '@angular/core';
import { EmptyRouteComponent } from './app.component';

const NO_ROUTING_TARGETS = ['action', 'external'];
import { LoginComponent } from './login/login.component';
import { environment } from '../environments/environment';
import { setNavigation } from './app.navconfig';
import { RapidwebComponent } from './rapidweb/rapidweb.component';
import { AuthGuard } from './shared/guards/auth/auth.guard';
import { CanActivateLogin } from './shared/guards/auth/can-activate.login';
import { PdfViewerComponent } from './pdf-viewer/pdf-viewer.component';
import { pdfviewerRoutes } from './pdf-viewer/pdf-viewer.routes';

interface NavigationData {
  path: string;
  canActivate: any[];
  loadChildren?: () => Promise<any>;
  loadComponent?: () => Promise<any>;
}

const loginRoutes: Routes = [
  { path: `${environment.baseHref}/login`, component: LoginComponent, canActivate: [CanActivateLogin] },
  { path: environment.baseHref, redirectTo: `${environment.baseHref}/login`, pathMatch: 'full' },
];

const rapidnRoutes: Routes = [
  { path: `${environment.baseHref}/rapid/:rapidId`, component: RapidwebComponent, canActivate: [AuthGuard] },
];

const pdfViewer: Routes = [
  {
    path: `${environment.baseHref}/pdf`,
    component: PdfViewerComponent,
    resolve: {},
    canActivate: [AuthGuard],
  },
  {
    path: `${environment.baseHref}/pdf/:path`,
    component: PdfViewerComponent,
    canActivate: [AuthGuard],
  },
];
export const setNavigationDefinitions = (navigation: Array<any>) => {
  setNavigation();

  const _appRoutes: any = [];
  _appRoutes.push(...loginRoutes, ...rapidnRoutes, ...pdfviewerRoutes);
  navigation.forEach((navItem) => {
    if (NO_ROUTING_TARGETS.includes(navItem.target)) return;
    const navPath = `${environment.baseHref}/${navItem.path}`;
    const data: NavigationData = {
      path: navPath,
      canActivate: [AuthGuard],
    };
    if (navItem.hasChildren) {
      data.loadChildren = () =>
        import('./' + navItem.component + '/' + navItem.component + '.routes.ts')
          .then((m) => m[navItem.component + 'Routes'])
          .catch((error) => {
            console.error(`Error loading module for ${navItem.component}:`, error);
            return null;
          });
    } else {
      const compName = (navItem.component.charAt(0).toUpperCase() +
        navItem.component.slice(1) +
        'Component') as keyof typeof Component;
      data.loadComponent = () =>
        import('./' + navItem.component + '/' + navItem.component + '.component.ts').then((m) => m[compName]);
    }

    if (navItem.target !== 'rapid') {
      _appRoutes.push(data);
    }
  });
  _appRoutes.push({ path: '**', component: EmptyRouteComponent });
  console.log(_appRoutes);
  return _appRoutes;
};
export const appRoutes: Route[] = setNavigationDefinitions(environment.navigation);

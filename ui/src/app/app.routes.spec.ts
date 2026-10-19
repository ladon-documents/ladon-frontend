import { AuthGuard } from './shared/guards/auth/auth.guard';
import { AccountSettingsComponent } from './account-settings/account-settings.component';
import { environment } from '../environments/environment';
import { setNavigationDefinitions } from './app.routes';

describe('app routes', () => {
  it('registers only the rapid id route for Rapidweb', () => {
    const routes = setNavigationDefinitions([]);
    const rapidPaths = routes
      .map((route: { path?: string }) => route.path)
      .filter((path: string | undefined) => path?.startsWith(`${environment.baseHref}/rapid`));

    expect(rapidPaths).toEqual([`${environment.baseHref}/rapid/:rapidId`]);
  });

  it('registers one guarded, lazy account settings route before the wildcard', async () => {
    const routes = setNavigationDefinitions([]);
    const accountSettingsPath = `${environment.baseHref}/account-settings`;
    const accountSettingsRoutes = routes.filter((route: { path?: string }) => route.path === accountSettingsPath);
    const wildcardIndex = routes.findIndex((route: { path?: string }) => route.path === '**');
    const accountSettingsIndex = routes.findIndex((route: { path?: string }) => route.path === accountSettingsPath);
    const [accountSettingsRoute] = accountSettingsRoutes;

    expect(accountSettingsRoutes.length).toBe(1);
    expect(accountSettingsRoute.canActivate).toEqual([AuthGuard]);
    expect(accountSettingsRoute.loadComponent).toEqual(jasmine.any(Function));
    expect(accountSettingsRoute.component).toBeUndefined();
    expect(await accountSettingsRoute.loadComponent()).toBe(AccountSettingsComponent);
    expect(accountSettingsIndex).toBeLessThan(wildcardIndex);
  });
});

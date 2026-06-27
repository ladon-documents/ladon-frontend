import { environment } from '../environments/environment';
import { setNavigationDefinitions } from './app.routes';

describe('app routes', () => {
  it('registers only the static id route for Staticweb', () => {
    const routes = setNavigationDefinitions([]);
    const staticPaths = routes
      .map((route: { path?: string }) => route.path)
      .filter((path: string | undefined) => path?.startsWith(`${environment.baseHref}/static`));

    expect(staticPaths).toEqual([`${environment.baseHref}/static/:staticId`]);
  });
});

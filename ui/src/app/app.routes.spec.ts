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
});

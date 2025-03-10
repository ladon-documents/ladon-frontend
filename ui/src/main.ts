const fetchNavigation = fetch('/ui/draco/ladon-core/public/navigation.json');
import * as api from '@utility';
export let navigationConfig: Array<any> = [];

api.utility.Initalizer().initWebComponents();

fetchNavigation
  .then((res) => res.json())
  .then((nav) => (navigationConfig = nav))
  .then(() => import('./bootstrap').catch((err) => console.error(err)));

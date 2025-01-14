import { merge } from 'lodash';
import { navigationConfig } from '../main';
import { environment } from '../environments/environment';

export const setNavigation = () => {
  merge(environment, { navigation: navigationConfig });
};

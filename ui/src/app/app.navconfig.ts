import { merge } from 'lodash';
import { navigationConfig } from '../main';
import { environment } from '../environments/environment';
import { Injectable } from '@angular/core';
import { DefaultUrlSerializer, UrlTree } from '@angular/router';

export const setNavigation = () => {
  merge(environment, { navigation: navigationConfig });
};

@Injectable()
export class CustomUrlSerializer extends DefaultUrlSerializer {
  override serialize(tree: UrlTree): string {
    let url = super.serialize(tree);
    url = url.replace(/%2F/g, '/');
    return url;
  }
}

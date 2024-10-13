import { Injectable } from '@angular/core';
import Storage from './storage.service';

export enum AUTH_STORE {
  LADON_AUTH = '@mind/ladon-auth-name',
}

@Injectable({
  providedIn: 'root'
})
export class AuthStorageService  extends Storage<AUTH_STORE> {

  constructor() {
    super();
  }

  public getData(): any {
    const _data = this.get(AUTH_STORE.LADON_AUTH);
    if (_data) return JSON.parse(_data)
    return null;
  }

  public setData(data: any): void {
    const currentStorage = this.getData() || {};
    const newStorage = {...currentStorage, ...data};
    const p =  JSON.stringify(newStorage)
    this.set(AUTH_STORE.LADON_AUTH, p);
  }

  public removeData() {
    this.clearItems([AUTH_STORE.LADON_AUTH]);
  }
}

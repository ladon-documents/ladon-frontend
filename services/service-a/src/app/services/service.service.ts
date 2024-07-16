import { Injectable } from '@angular/core';

@Injectable()
export class ServiceService {
  private _title = `ServiceService`
  constructor() { }

  get title(): string {
    return this._title
  }
}

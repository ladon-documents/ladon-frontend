
import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { FilemanagerFacade } from './filemanager.facade';
import { FilemanagerStore } from '../store/filemanager.store';

@Injectable({
  providedIn: 'root'
})
export class FilemanagerBucketResolver implements Resolve<string | null> {

  constructor(private filemanagerFacade: FilemanagerFacade) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<string | null> {
    const bucket = route.paramMap.get('bucket');

    if (bucket) {
      this.filemanagerFacade.loadBucket(bucket);
      return of(bucket);
    }

    return of(null);
  }
}

@Injectable({
  providedIn: 'root'
})
export class FilemanagerFolderResolver implements Resolve<string | null> {
  readonly #filemanagerStore = inject(FilemanagerStore);

  constructor(private filemanagerFacade: FilemanagerFacade) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<string | null> {
    const bucket = route.paramMap.get('bucket');
    const subfolders = route.paramMap.get('subfolders');

    if (subfolders) {
   //   this.filemanagerFacade.load(this.#selectedDocument);
      return of(subfolders);
    }

    return of(null);
  }
}

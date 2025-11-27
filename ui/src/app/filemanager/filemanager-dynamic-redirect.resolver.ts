import { inject, Injectable } from '@angular/core';
import { Resolve, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { FilemanagerStore } from '../store/filemanager.store';
import { AppStore } from '../store/app.store';
import { LadonRouterService } from '../services/ladon-router.service';
import { BucketsStore } from '../store/bucket.store';

@Injectable({
  providedIn: 'root',
})
export class FilemanagerDynamicRedirectResolver implements Resolve<boolean> {
  readonly #router = inject(LadonRouterService);
  readonly #bucketStore = inject(BucketsStore);
  readonly #filemanagerStore = inject(FilemanagerStore);

  resolve(): Observable<boolean> {
    const selectedBucket = this.#filemanagerStore.selectedBucket();
    if (selectedBucket) {
      this.#router.navigateToFilemanagerWithBucket(selectedBucket);
      return of(false);
    }

    const firstBucket = this.#bucketStore.allBuckets()[0];
    if (firstBucket && firstBucket.id) {
      this.#router.navigateToFilemanagerWithBucket(firstBucket.id);
    }
    return of(false);
  }
}

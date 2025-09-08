import { inject, Injectable } from '@angular/core';
import { Resolve, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { FilemanagerStore } from '../store/filemanager.store';
import { AppStore } from '../store/app.store';
import { LadonRouterService } from '../services/ladon-router.service';

@Injectable({
  providedIn: 'root',
})
export class FilemanagerDynamicRedirectResolver implements Resolve<boolean> {
  readonly #router = inject(LadonRouterService);
  readonly #appStore = inject(AppStore);
  readonly #filemanagerStore = inject(FilemanagerStore);

  resolve(): Observable<boolean> {
    const selectedBucket = this.#filemanagerStore.selectedBucket();
    if (selectedBucket) {
      this.#router.navigateToFilemanagerWithBucket(selectedBucket);
      return of(false);
    }

    const homebucket = this.#appStore.auth.user()?.homeBucket;
    if (homebucket) {
      this.#router.navigateToFilemanagerWithBucket(homebucket);
    }
    return of(false);
  }
}

import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class LadonRouterService {
  readonly #navigationEntries: Array<any> = [];
  #baseHref: string;
  constructor(private readonly router: Router) {
    this.#navigationEntries = environment.navigation;
    this.#baseHref = environment.baseHref ?? '';
  }

  async navigateToFilemanagerWithBucket(bucket: string) {
    const filemangerNavigation = this.#navigationEntries.find((entry) => entry.component === 'filemanager');
    if (filemangerNavigation && filemangerNavigation.path) {
      await this.router.navigate([`${this.#baseHref}/${filemangerNavigation.path}/${bucket}`]);
    }
    return Promise.resolve();
  }
}

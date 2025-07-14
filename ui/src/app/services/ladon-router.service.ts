import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { NavigationEntry } from '../interfaces/navigation-entry';

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

  async navigateToLogin() {
    await this.router.navigateByUrl(`${this.#baseHref}/login`);
    return Promise.resolve();
  }

  async navigateToFilemanagerWithBucket(bucket: string) {
    const filemangerNavigation = this.getFileManagerNavigationEntry();
    if (filemangerNavigation && filemangerNavigation.path) {
      await this.router.navigate([`${this.#baseHref}/${filemangerNavigation.path}`]);
    }
    return Promise.resolve();
  }

  async filemanagerRoute(bucket: string, path: string) {
    const filemangerNavigation = this.getFileManagerNavigationEntry();
    if (filemangerNavigation && filemangerNavigation.path) {
      await this.router.navigate([`${this.#baseHref}/${filemangerNavigation.path}/${bucket}/${path}`]);
    }
    return Promise.resolve();
  }

  async navigateToFolder(bucket: string, key: string) {
    const filemangerNavigation = this.getFileManagerNavigationEntry();
    if (filemangerNavigation && filemangerNavigation.path) {
      const path = `${this.#baseHref}/${filemangerNavigation.path}/`;
      await this.router.navigate([path, bucket, key]);
    }
  }

  getFilemanagerBaseRoute() {
    const filemangerNavigation = this.getFileManagerNavigationEntry();
    if (filemangerNavigation && filemangerNavigation.path) {
      return `${this.#baseHref}/${filemangerNavigation.path}/`;
    }
    return undefined;
  }

  private getFileManagerNavigationEntry(): NavigationEntry | undefined {
    return this.#navigationEntries.find((entry) => entry.component === 'filemanager');
  }
}

import { Component, input, output, computed, inject, OnInit, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroFolder,
  heroDocumentText,
  heroListBullet,
  heroArrowRightStartOnRectangle,
  heroRectangleStack,
  heroUsers,
  heroPuzzlePiece,
  heroDocument,
  heroGlobeAlt,
} from '@ng-icons/heroicons/outline';
import { NavigationEnd, Router } from '@angular/router';
import { NavigationEntry } from '../interfaces/navigation-entry';
import { environment } from '../../environments/environment';
import { TranslatePipe } from '@ngx-translate/core';
import { AppStore } from '../store/app.store';
import { filter } from 'rxjs';

@Component({
  selector: 'lib-navigation',
  standalone: true,
  imports: [CommonModule, NgIconComponent, TranslatePipe],
  providers: [
    provideIcons({
      heroFolder,
      heroUsers,
      heroDocumentText,
      heroListBullet,
      heroArrowRightStartOnRectangle,
      heroRectangleStack,
      heroPuzzlePiece,
      heroDocument,
      heroGlobeAlt,
    }),
  ],
  templateUrl: './navigation.component.html',
})
export class NavigationComponent implements OnInit {
  readonly #store = inject(AppStore);
  navigation = input.required<NavigationEntry[]>();
  mainMenu = computed(() => this.navigation().filter(({ type }) => type === 'main'));
  subMenu = computed(() => this.navigation().filter(({ type }) => type === 'menu'));
  navigationEntryAction = output<NavigationEntry>();
  routerActiveLink: string | undefined;

  sidebarCollapsed: Signal<boolean> = this.#store.ui.isSidenavClosed;

  logout(): void {
    this.#store.logout();
  }

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      const { urlAfterRedirects } = event as NavigationEnd;
      this.routerActiveLink = this.extractPathFromUrl(urlAfterRedirects);
    });
  }

  async invokeItem(item: NavigationEntry) {
    switch (item.target) {
      case 'internal':
      case 'remote':
        await this.router.navigate([`${environment.baseHref}/${item.path}`]);
        break;
      case 'static':
        await this.router.navigate([`${environment.baseHref}/static`], { queryParams: { page: item.path } });
        break;
      case 'action':
        this.dispatchNavigationEvent(item);
        break;
      case 'external':
        window.open(item.path, '_blank');
        break;
    }
  }

  /*
   * Extracts fourth segment from url because we need to be careful of sub routes.
   */
  private extractPathFromUrl(url: string): string | undefined {
    return url.split('/')[4];
  }

  private dispatchNavigationEvent(item: NavigationEntry) {
    if (item.id === 'ladon:logout') {
      this.#store.logout();
      return;
    }
    window.dispatchEvent(new CustomEvent('ladon:navigation:item', { detail: item }));
  }
}

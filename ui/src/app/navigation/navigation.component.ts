import { Component, input, output, computed, inject, OnInit, HostListener, Signal } from '@angular/core';
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
import { Router } from '@angular/router';
import { NavigationEntry } from '../interfaces/navigation-entry';
import { environment } from '../../environments/environment';
import { TranslatePipe } from '@ngx-translate/core';
import { AppStore } from '../store/app.store';

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

  isOpen = false;

  //sidebarCollapsed = false;
  sidebarCollapsed: Signal<boolean> = this.#store.ui.isSidenavClosed;
  openSubMenu = '';


  // Sidebar minimieren/maximieren (nur Icons oder Icons mit Text)
  collapseSidebar() {
    //  this.sidebarCollapsed = !this.sidebarCollapsed;
    this.#store.toggleSidebar();
  }

  toggleSubMenu(menu: string) {
    this.openSubMenu = this.openSubMenu === menu ? '' : menu;
  }

  logout(): void {
    this.#store.logout();
  }

  constructor(private router: Router) {}

  ngOnInit() {
    
  }

  async invokeItem(item: NavigationEntry) {
    switch (item.target) {
      case 'internal':
      case 'remote':
        await this.router.navigate([`${environment.baseHref}/${item.path}`]);
        this.routerActiveLink = item.path;
        break;
      case 'static':
        await this.router.navigate([`${environment.baseHref}/static`], { queryParams: { page: item.path } });
        this.routerActiveLink = item.path;
        break;
      case 'action':
        this.dispatchNavigationEvent(item);
        break;
      case 'external':
        window.open(item.path, '_blank');
        break;
    }
  }

  private dispatchNavigationEvent(item: NavigationEntry) {
    if (item.id === 'ladon:logout') {
      this.#store.logout();
      return;
    }
    window.dispatchEvent(new CustomEvent('ladon:navigation:item', { detail: item }));
  }
}

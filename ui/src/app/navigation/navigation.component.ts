import { Component, input, output, computed, inject, OnInit, Signal, viewChild, ElementRef } from '@angular/core';
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
  heroChevronDoubleLeft,
  heroChevronDoubleRight,
} from '@ng-icons/heroicons/outline';
import { NavigationEnd, Router } from '@angular/router';
import { NavigationEntry } from '../interfaces/navigation-entry';
import { environment } from '../../environments/environment';
import { TranslatePipe } from '@ngx-translate/core';
import { AppStore } from '../store/app.store';
import { filter, finalize, tap } from 'rxjs';

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
      heroChevronDoubleLeft,
      heroChevronDoubleRight,
    }),
  ],
  templateUrl: './navigation.component.html',
})
export class NavigationComponent implements OnInit {
  private timeOut: any | undefined;
  private readonly timeOutDuration = 250;
  readonly appStore = inject(AppStore);
  readonly highlight = viewChild<ElementRef>('highlight');
  readonly nav = viewChild<ElementRef>('nav');
  navigation = input.required<NavigationEntry[]>();
  mainMenu = computed(() => this.navigation().filter(({ type }) => type === 'main'));
  subMenu = computed(() => this.navigation().filter(({ type }) => type === 'menu'));
  navigationEntryAction = output<NavigationEntry>();
  routerActiveLink: string | undefined;

  sidebarCollapsed: Signal<boolean> = this.appStore.ui.isSidenavClosed;

  logout(): void {
    this.appStore.logout();
  }

  constructor(private router: Router) {}

  ngOnInit() {
    // Set intial active link based on current route
    this.timeOut = setTimeout(() => this.animateHighlight(), this.timeOutDuration);
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        tap(() => {
          clearTimeout(this.timeOut);
        }),
      )
      .subscribe((event) => {
        const { urlAfterRedirects } = event as NavigationEnd;
        this.routerActiveLink = this.extractPathFromUrl(urlAfterRedirects);
        this.timeOut = setTimeout(() => this.animateHighlight(), this.timeOutDuration);
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

  collapseSidebar() {
    this.appStore.toggleSidebar();
  }

  /*
   * Extracts fourth segment from url because we need to be careful of sub routes.
   */
  private extractPathFromUrl(url: string): string | undefined {
    return url.split('/')[4];
  }

  private animateHighlight() {
    const activeItem = this.nav()?.nativeElement.querySelector('.text-blue-700');
    const highlightElement = this.highlight()?.nativeElement;
    try {
      const { y } = activeItem?.getBoundingClientRect();
      const headerHeight = 72;

      if ('startViewTransition' in document) {
        // @ts-ignore
        document.startViewTransition(() => {
          highlightElement.style.top = `${Math.round(y - headerHeight)}px`;
        });
      } else {
        highlightElement.style.top = `${Math.round(y - headerHeight)}px`;
      }
    } catch (e) {
      console.warn(e);
    }
  }

  private dispatchNavigationEvent(item: NavigationEntry) {
    if (item.id === 'ladon:logout') {
      this.appStore.logout();
      return;
    }
    window.dispatchEvent(new CustomEvent('ladon:navigation:item', { detail: item }));
  }
}

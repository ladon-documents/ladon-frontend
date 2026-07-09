import { Component, CUSTOM_ELEMENTS_SCHEMA, effect, inject, OnDestroy, OnInit, Signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AsideComponent } from './layout/aside/aside.component';
import { UsermanagerComponent } from './usermanager/usermanager.component';
import { BucketsComponent } from './buckets/buckets.component';
import { CommonModule } from '@angular/common';
import { NavigationEntry } from './interfaces/navigation-entry';
import { NavigationComponent } from './navigation/navigation.component';
import { AuthService } from './services/auth.service';
import { LoginComponent } from './login/login.component';
import { FilemanagerComponent } from './filemanager/filemanager.component';
import { TaskmanagerComponent } from './taskmanager/taskmanager.component';
import { PluginmanagerComponent } from './pluginmanager/pluginmanager.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppStore } from './store/app.store';
import { HeaderComponent } from './header/header.component';
import { PdfviewerComponent } from './shared/components/pdfviewer/pdfviewer.component';
import { Document } from '@ladon/api';
import { SpinnerComponent } from './shared/components/spinner/spinner.component';
import { KeyboardShortcutsService } from './shared/services/keyboard-shortcuts.service';
import { ContextMenuComponent } from './shared/components/context-menu/context-menu.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ConfirmationDialogComponent } from './shared/components/confirmation-dialog/confirmation-dialog.component';
import { InputDialogComponent } from './shared/components/input-dialog/input-dialog.component';
import { NavigationStore } from './navigation/navigation-store.service';
import { DracoStaticRegistryService } from './staticweb/draco-static-registry.service';

@Component({
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    NavigationComponent,
    HeaderComponent,
    SpinnerComponent,
    ContextMenuComponent,
    ToastComponent,
    ConfirmationDialogComponent,
    InputDialogComponent,
  ],
  standalone: true,
  selector: 'ldn-ui',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppComponent implements OnInit, OnDestroy {
  readonly store = inject(AppStore);
  private readonly navigationStore = inject(NavigationStore);
  private readonly staticRegistry = inject(DracoStaticRegistryService);
  private mql: MediaQueryList | undefined;
  private staticNavigationDiscoveryInFlight = false;
  private staticNavigationDiscoveryReady = false;

  isAuthenticated: Signal<boolean> = this.store.auth.isAuthenticated;
  isAuthenticating: Signal<boolean> = this.store.auth.isAuthenticating;

  public navigationEntries: Array<NavigationEntry> = [];
  private keyboardShortcuts = inject(KeyboardShortcutsService);

  sidebarCollapsed: Signal<boolean> = this.store.ui.isSidenavClosed;

  constructor(private translate: TranslateService) {
    effect(() => {
      this.navigationEntries = this.navigationStore.entries();

      if (this.isAuthenticated() && !this.staticNavigationDiscoveryReady && !this.staticNavigationDiscoveryInFlight) {
        void this.discoverStaticNavigation();
      }
    });

    this.translate.addLangs(['de', 'en']);
    this.translate.setDefaultLang('de');
    this.translate.use('de');
  }

  ngOnInit() {
    this.mql = window.matchMedia('(prefers-color-scheme: light)');
    this.mql.addEventListener('change', (event) => {
      this.checkAndSetPreferredColorScheme(event.matches);
    });

    this.checkAndSetPreferredColorScheme(this.mql.matches);
    this.keyboardShortcuts.init();
  }

  ngOnDestroy(): void {
    this.mql?.removeEventListener('change', (event) => {
      this.checkAndSetPreferredColorScheme(event.matches);
    });
  }

  private checkAndSetPreferredColorScheme(matches: boolean): void {
    const htmlElement = document.querySelector('html');
    if (htmlElement) {
      htmlElement.dataset['theme'] = matches ? 'light' : 'dark';
      localStorage.setItem('theme', matches ? 'light' : 'dark');
      this.store.toggleDarkMode(!matches);
    }
  }

  onPdfLoaded(event: { document: Document; totalPages: number }): void {
    console.log(`PDF geladen: ${event.document.name} mit ${event.totalPages} Seiten`);
  }

  onPdfError(event: { document: Document | null; error: string }): void {
    console.error('PDF Fehler:', event.error, event.document);
  }

  onPageChanged(event: { document: Document | null; page: number; totalPages: number }): void {
    console.log(`Seite geändert: ${event.page}/${event.totalPages} für ${event.document?.name}`);
  }

  onDownloadRequested(event: { document: Document }): void {
    console.log('Download angefordert für:', event.document.name);
  }

  onPrintRequested(event: { document: Document }): void {
    console.log('Druck angefordert für:', event.document.name);
  }

  onPdfClosed(event: { document: Document | null }): void {
    console.log('PDF Viewer geschlossen für:', event.document?.name);
  }

  private async discoverStaticNavigation(): Promise<void> {
    this.staticNavigationDiscoveryInFlight = true;

    try {
      const snapshot = await this.staticRegistry.discover();
      if (snapshot.state === 'ready') {
        this.navigationStore.setStatic(
          snapshot.entries
            .map((entry) => entry.navigation)
            .filter((entry): entry is NavigationEntry => this.isStaticNavigationEntry(entry)),
        );
        this.staticNavigationDiscoveryReady = true;
      }
    } catch (error) {
      console.warn('Static navigation discovery failed.', error);
    } finally {
      this.staticNavigationDiscoveryInFlight = false;
    }
  }

  private isStaticNavigationEntry(entry: NavigationEntry | undefined): entry is NavigationEntry {
    return (
      !!entry &&
      entry.target === 'static' &&
      typeof entry.id === 'string' &&
      entry.id.startsWith('static:') &&
      typeof entry.label === 'string' &&
      entry.label.trim().length > 0 &&
      typeof entry.path === 'string' &&
      entry.path.trim().length > 0
    );
  }
}

@Component({
  standalone: true,
  selector: 'app-empty-route',
  template: '',
})
export class EmptyRouteComponent {}

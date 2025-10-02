import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AsideComponent } from './layout/aside/aside.component';
import { UsermanagerComponent } from './usermanager/usermanager.component';
import { BucketsComponent } from './buckets/buckets.component';
import { CommonModule } from '@angular/common';
import { NavigationEntry } from './interfaces/navigation-entry';
import { environment } from '../environments/environment';
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
import { PdfViewerComponent } from './pdf-viewer/pdf-viewer.component';
import { DocumentModel } from '../api';

@Component({
  imports: [CommonModule, RouterModule, TranslateModule, NavigationComponent, HeaderComponent, PdfViewerComponent],
  standalone: true,
  selector: 'ldn-ui',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppComponent {
  readonly store = inject(AppStore);
  isAuthenticated: Signal<boolean> = this.store.auth.isAuthenticated;
  isAuthenticating: Signal<boolean> = this.store.auth.isAuthenticating;

  public navigationEntries: Array<NavigationEntry> = [];

  sidebarCollapsed: Signal<boolean> = this.store.ui.isSidenavClosed;

  constructor(
    private readonly as: AuthService,
    private translate: TranslateService,
  ) {
    this.navigationEntries = environment.navigation;
    this.translate.addLangs(['de', 'en']);
    this.translate.setDefaultLang('de');
    this.translate.use('de');
  }

  onPdfLoaded(event: { document: DocumentModel; totalPages: number }): void {
    console.log(`PDF geladen: ${event.document.name} mit ${event.totalPages} Seiten`);
  }

  onPdfError(event: { document: DocumentModel | null; error: string }): void {
    console.error('PDF Fehler:', event.error, event.document);
  }

  onPageChanged(event: { document: DocumentModel | null; page: number; totalPages: number }): void {
    console.log(`Seite geändert: ${event.page}/${event.totalPages} für ${event.document?.name}`);
  }

  onDownloadRequested(event: { document: DocumentModel }): void {
    console.log('Download angefordert für:', event.document.name);
  }

  onPrintRequested(event: { document: DocumentModel }): void {
    console.log('Druck angefordert für:', event.document.name);
  }

  onPdfClosed(event: { document: DocumentModel | null }): void {
    console.log('PDF Viewer geschlossen für:', event.document?.name);
  }
}

@Component({
  standalone: true,
  selector: 'app-empty-route',
  template: '',
})
export class EmptyRouteComponent {}

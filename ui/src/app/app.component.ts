import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, HostListener, inject, Signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AsideComponent } from './layout/aside/aside.component';
import { UsermanagerComponent } from './usermanager/usermanager.component';
import { BucketsComponent } from './buckets/buckets.component';
import { AsyncPipe, CommonModule } from '@angular/common';
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

@Component({
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    NavigationComponent,
    HeaderComponent,
    PdfviewerComponent,
    PluginmanagerComponent,
    AsideComponent,
    UsermanagerComponent,
    BucketsComponent,
    LoginComponent,
    FilemanagerComponent,
    TaskmanagerComponent,
    AsyncPipe,
  ],
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
}

@Component({
  standalone: true,
  selector: 'app-empty-route',
  template: '',
})
export class EmptyRouteComponent {}

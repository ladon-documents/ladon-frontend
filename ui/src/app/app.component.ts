import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
import { Observable } from 'rxjs';
import { FilemanagerComponent } from './filemanager/filemanager.component';
import {PluginmanagerComponent} from "./pluginmanager/pluginmanager.component";

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavigationComponent,
      PluginmanagerComponent,
    AsideComponent,
    UsermanagerComponent,
    BucketsComponent,
    LoginComponent,
    FilemanagerComponent,
    AsyncPipe,
  ],
  selector: 'ldn-ui',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppComponent {
  public navigationEntries: Array<NavigationEntry> = [];
  isAuthenticated$: Observable<any>;

  constructor(private readonly as: AuthService) {
    this.navigationEntries = environment.navigation;
    this.isAuthenticated$ = this.as.user$;
  }
}

@Component({
  standalone: true,
  selector: 'app-empty-route',
  template: '',
})
export class EmptyRouteComponent {}

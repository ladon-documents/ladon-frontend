import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchbarComponent } from '../searchbar/searchbar.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { AppStore } from '../store/app.store';
import { environment } from '../../environments/environment';
import { UploadsComponent } from '@ladon/shared';

@Component({
  selector: 'app-header',
  imports: [CommonModule, SearchbarComponent, AvatarComponent, UploadsComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly appStore = inject(AppStore);
  readonly ladonVersion = environment.version;
  darkMode = false;

  toggleSidebar() {
    this.appStore.toggleBurgerMenu();
  }

  collapseSidebar() {
    this.appStore.toggleSidebar();
  }
}

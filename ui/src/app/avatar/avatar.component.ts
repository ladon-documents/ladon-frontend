import { Component, inject, Signal } from '@angular/core';
import {ThemesComponent} from "../themes/themes.component";
import { AppStore } from '../store/app.store';
import { CommonModule } from '@angular/common';
import { NgIconComponent } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'lib-avatar',
  imports: [CommonModule, ThemesComponent],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
})
export class AvatarComponent {
  readonly #store = inject(AppStore);
  fullName = this.#store.auth.user()?.fullName;
  userId = this.#store.auth.user()?.userId;
  sidebarCollapsed: Signal<boolean> = this.#store.ui.isSidenavClosed;


  logout() {
    this.#store.logout();

  }
}

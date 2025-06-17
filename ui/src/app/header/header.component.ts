import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchbarComponent } from '../searchbar/searchbar.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { AppStore } from '../store/app.store';

@Component({
  selector: 'app-header',
  imports: [CommonModule, SearchbarComponent, AvatarComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  readonly appStore = inject(AppStore);
  darkMode = false;

  ngOnInit() {
    this.loadThemePreference();
  }

  // Theme umschalten
  toggleTheme() {
    this.darkMode = !this.darkMode;
    this.saveThemePreference();
  }

  toggleSidebar() {
    this.appStore.toggleBurgerMenu();
  }

  collapseSidebar() {
    this.appStore.toggleSidebar();
  }

  private loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
      this.darkMode = savedTheme === 'dark';
    } else {
      // Systemeinstellung verwenden, falls keine Einstellung gespeichert ist
      this.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }

  private saveThemePreference() {
    localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
  }
}

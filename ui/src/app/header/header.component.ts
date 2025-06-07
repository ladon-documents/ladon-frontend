import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { NgIconComponent } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SearchbarComponent } from '../searchbar/searchbar.component';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  selector: 'app-header',
  imports: [CommonModule, NgIconComponent, TranslatePipe, NgIf, SearchbarComponent, AvatarComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  // Menü Zustände
  userMenuOpen = false; // Benutzer-Dropdown-Menü
  openSubMenu = ''; // Aktuell geöffnetes Untermenü
  // Theme
  darkMode = false;
  sidebarHidden = true; // Komplett ausgeblendete Sidebar (nur auf Mobilgeräten)

  ngOnInit() {
    this.loadThemePreference();
  }

  // Theme umschalten
  toggleTheme() {
    this.darkMode = !this.darkMode;
    this.saveThemePreference();
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

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
    if (this.userMenuOpen) {
      this.openSubMenu = '';
    }
  }

  // Sidebar auf mobilen Geräten ein-/ausblenden (vollständiges Ein-/Ausblenden)
  toggleSidebar() {
    this.sidebarHidden = !this.sidebarHidden;
  }
}

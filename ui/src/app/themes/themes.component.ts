import { Component, inject } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { heroMoon, heroSun } from '@ng-icons/heroicons/outline';
import { AppStore } from '../store/app.store';

@Component({
  selector: 'lib-themes',
  imports: [],
  providers: [
    provideIcons({
      heroSun,
      heroMoon,
    }),
  ],
  templateUrl: './themes.component.html',
  styleUrl: './themes.component.scss',
})
export class ThemesComponent {
  currentTheme = 'system';
  availableThemes = [
    { name: 'light', label: 'Hell', icon: 'sun' },
    { name: 'dark', label: 'Dunkel', icon: 'moon' },
    { name: 'system', label: 'System', icon: 'desktop' },
  ];

  readonly appStore = inject(AppStore);

  changeTheme(theme: string): void {
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  }

  applyTheme(theme: string): void {
    const htmlElement = document.querySelector('html');
    if (!htmlElement) return;
    htmlElement.setAttribute('data-theme', theme);
    this.appStore.toggleDarkMode(theme === 'dark');

    if (theme === 'system') {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        htmlElement.setAttribute('data-theme', 'dark');
        this.appStore.toggleDarkMode(true);
      } else {
        htmlElement.setAttribute('data-theme', 'light');
        this.appStore.toggleDarkMode(false);
      }
    }
  }
}

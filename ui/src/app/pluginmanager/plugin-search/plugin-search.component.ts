import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroMagnifyingGlass, heroXMark } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-plugin-search',
  imports: [CommonModule, NgIcon],
  providers: [provideIcons({ heroMagnifyingGlass, heroXMark })],
  templateUrl: './plugin-search.component.html',
  styleUrl: './plugin-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginSearchComponent {
  searchTerm = input('');
  searchTermChange = output<string>();

  updateSearchTerm(event: Event): void {
    this.searchTermChange.emit((event.target as HTMLInputElement).value);
  }

  clear(): void {
    this.searchTermChange.emit('');
  }
}

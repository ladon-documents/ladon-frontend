import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroCheck, heroChevronRight, heroCube, heroExclamationTriangle } from '@ng-icons/heroicons/outline';
import { PluginManagerAction, PluginManagerItem } from '../models/pluginmanager.models';

@Component({
  selector: 'app-plugin-list',
  imports: [CommonModule, NgIcon],
  providers: [provideIcons({ heroCheck, heroChevronRight, heroCube, heroExclamationTriangle })],
  templateUrl: './plugin-list.component.html',
  styleUrl: './plugin-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginListComponent {
  plugins = input<PluginManagerItem[]>([]);
  selectedPluginId = input<string | null>(null);
  activeAction = input<PluginManagerAction | null>(null);
  isLoading = input(false);
  pluginSelected = output<string>();

  selectPlugin(plugin: PluginManagerItem): void {
    this.pluginSelected.emit(plugin.pluginId);
  }

  isSelected(plugin: PluginManagerItem): boolean {
    return plugin.pluginId === this.selectedPluginId();
  }

  isActionRunning(plugin: PluginManagerItem): boolean {
    return plugin.pluginId === this.activeAction()?.pluginId;
  }
}

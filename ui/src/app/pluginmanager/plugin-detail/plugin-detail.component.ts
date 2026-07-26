import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PluginDocumentationPanelComponent } from '../plugin-documentation-panel/plugin-documentation-panel.component';
import {
  PluginManagerAction,
  PluginManagerActionType,
  PluginManagerError,
  PluginManagerItem,
} from '../models/pluginmanager.models';

@Component({
  selector: 'app-plugin-detail',
  imports: [CommonModule, PluginDocumentationPanelComponent],
  templateUrl: './plugin-detail.component.html',
  styleUrl: './plugin-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginDetailComponent {
  plugin = input.required<PluginManagerItem>();
  activeAction = input<PluginManagerAction | null>(null);
  actionError = input<PluginManagerError | null>(null);
  actionTriggered = output<{ item: PluginManagerItem; actionType: PluginManagerActionType }>();

  primaryAction(): PluginManagerActionType | null {
    const plugin = this.plugin();
    if (plugin.canUpdate) {
      return plugin.isBundle ? 'bundleInstall' : 'update';
    }
    if (plugin.canInstall) {
      return 'install';
    }
    return null;
  }

  primaryActionLabel(): string {
    const action = this.primaryAction();
    if (action === 'install') {
      return 'Install';
    }
    if (action === 'bundleInstall') {
      return 'Update bundle';
    }
    return 'Update';
  }

  isActionRunning(): boolean {
    return this.activeAction()?.pluginId === this.plugin().pluginId;
  }

  triggerPrimaryAction(): void {
    const actionType = this.primaryAction();
    if (actionType) {
      this.actionTriggered.emit({ item: this.plugin(), actionType });
    }
  }

  triggerDeinstall(): void {
    this.actionTriggered.emit({ item: this.plugin(), actionType: 'deinstall' });
  }
}

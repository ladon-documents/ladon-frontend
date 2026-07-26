import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PluginChannelNavComponent } from '../plugin-channel-nav/plugin-channel-nav.component';
import { PluginSearchComponent } from '../plugin-search/plugin-search.component';
import { PluginListComponent } from '../plugin-list/plugin-list.component';
import { PluginOverviewComponent } from '../plugin-overview/plugin-overview.component';
import { PluginDetailComponent } from '../plugin-detail/plugin-detail.component';
import {
  ChannelList,
  PluginChannel,
  PluginManagerAction,
  PluginManagerActionType,
  PluginManagerError,
  PluginManagerItem,
  PluginManagerOverview,
} from '../models/pluginmanager.models';

@Component({
  selector: 'app-plugin-workbench',
  imports: [
    CommonModule,
    PluginChannelNavComponent,
    PluginSearchComponent,
    PluginListComponent,
    PluginOverviewComponent,
    PluginDetailComponent,
  ],
  templateUrl: './plugin-workbench.component.html',
  styleUrl: './plugin-workbench.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginWorkbenchComponent {
  channels = input<ChannelList[]>([]);
  activeChannel = input<PluginChannel | null>(null);
  plugins = input<PluginManagerItem[]>([]);
  selectedPlugin = input<PluginManagerItem | null>(null);
  selectedPluginId = input<string | null>(null);
  searchTerm = input('');
  overview = input.required<PluginManagerOverview>();
  activeAction = input<PluginManagerAction | null>(null);
  loadError = input<PluginManagerError | null>(null);
  actionError = input<PluginManagerError | null>(null);
  isLoadingPlugins = input(false);

  channelSelected = output<PluginChannel>();
  searchTermChange = output<string>();
  pluginSelected = output<string>();
  actionTriggered = output<{ item: PluginManagerItem; actionType: PluginManagerActionType }>();
}

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelList } from '../models/pluginmanager.models';

@Component({
  selector: 'app-plugin-channel-nav',
  imports: [CommonModule],
  templateUrl: './plugin-channel-nav.component.html',
  styleUrl: './plugin-channel-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginChannelNavComponent {
  channels = input<ChannelList[]>([]);
  activeChannel = input<string | null>(null);
  channelSelected = output<string>();
}

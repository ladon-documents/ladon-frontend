import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PluginManagerError, PluginManagerOverview } from '../models/pluginmanager.models';

@Component({
  selector: 'app-plugin-overview',
  imports: [CommonModule],
  templateUrl: './plugin-overview.component.html',
  styleUrl: './plugin-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginOverviewComponent {
  overview = input.required<PluginManagerOverview>();
  error = input<PluginManagerError | null>(null);
}

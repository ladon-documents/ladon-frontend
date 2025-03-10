import { Component, input, InputSignal, signal, Signal, WritableSignal } from '@angular/core';
import { PluginService, PluginWithVersionStatus } from '../services/plugin.service';
import { SearchfilterPipe } from '../pipe/searchfilter.pipe';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-plugin-list',
  standalone: true,
  imports: [CommonModule, SearchfilterPipe, TranslatePipe],
  templateUrl: './plugin-list.component.html',
  styleUrl: './plugin-list.component.scss',
})
export class PluginListComponent {
  pluginList$: WritableSignal<Array<PluginWithVersionStatus>> = signal([]);
  isLoading$: WritableSignal<boolean> = signal(false);

  selectedItem: PluginWithVersionStatus | undefined;
  filterText = '';
  onSelect(item: PluginWithVersionStatus | undefined): void {}

  constructor(private pluginService: PluginService) {
    this.pluginService.getPlugins().subscribe((data) => {
      this.isLoading$.set(false);
      this.pluginList$.set(data);
    });
  }
}

import { Component, computed, input, InputSignal, OnInit, output, signal, Signal, WritableSignal } from '@angular/core';
import { PluginService, PluginWithVersionStatus } from '../services/plugin.service';
import { SearchfilterPipe } from '../pipe/searchfilter.pipe';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { heroCheck, heroChevronRight } from '@ng-icons/heroicons/outline';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { PillComponent } from '@ladon/shared';

@Component({
  selector: 'app-plugin-list',
  imports: [CommonModule, SearchfilterPipe, TranslatePipe, NgIcon, PillComponent],
  providers: [provideIcons({ heroCheck, heroChevronRight })],
  templateUrl: './plugin-list.component.html',
  styleUrl: './plugin-list.component.scss',
})
export class PluginListComponent implements OnInit {
  pluginList$: Signal<Array<PluginWithVersionStatus>> = signal([]);
  isLoading$: Signal<boolean> = signal(true);
  filterText$: Signal<string> = signal('');
  selectedItem: PluginWithVersionStatus | undefined;

  onSelect(item: PluginWithVersionStatus | undefined): void {
    if (!item) {
      return;
    }
    this.selectedItem = item;
    this.pluginService.setSelectedItem(item);
  }

  constructor(private pluginService: PluginService) {
    this.pluginList$ = computed(() => this.pluginService.plugins());
    this.filterText$ = computed(() => this.pluginService.filteredText());
    this.isLoading$ = computed(() => this.pluginService.isLoadingPlugins());
  }

  ngOnInit() {
    console.log('on init');
  }
}

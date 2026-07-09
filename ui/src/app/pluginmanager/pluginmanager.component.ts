import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, effect, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { PluginManagerStore } from '../store/pluginmanager.store';
import { PluginWorkbenchComponent } from './plugin-workbench/plugin-workbench.component';
import { PluginManagerActionType, PluginManagerItem } from './models/pluginmanager.models';

@Component({
  standalone: true,
  selector: 'pluginmanager',
  imports: [CommonModule, PluginWorkbenchComponent],
  templateUrl: './pluginmanager.component.html',
  styleUrl: './pluginmanager.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PluginmanagerComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    readonly store: PluginManagerStore,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    effect(() => {
      const normalizedChannel = this.store.normalizedChannel();
      if (normalizedChannel) {
        this.router.navigate(['../', normalizedChannel], {
          relativeTo: this.route,
          replaceUrl: true,
        });
      }
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.store.initialize(params.get('channelName'));
    });
  }

  onChannelSelected(channel: string): void {
    this.store.changeChannel(channel);
    this.router.navigate(['../', channel], { relativeTo: this.route });
  }

  onActionTriggered(event: { item: PluginManagerItem; actionType: PluginManagerActionType }): void {
    this.store.runPluginAction(event);
  }
}

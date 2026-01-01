import { Component, Input, OnInit, Output, EventEmitter, ElementRef } from '@angular/core';
import { PluginInstallState, PluginWithVersionStatus } from '../services/plugin.service';
import { PluginModel } from '../../../plugin';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { PillComponent } from '@ladon/shared';

@Component({
  selector: 'plugin-progressbar',
  templateUrl: './plugin-progressbar.component.html',
  imports: [CommonModule, TranslateModule, PillComponent],
  styleUrls: ['./plugin-progressbar.component.scss'],
})
export class PluginProgressbarComponent implements OnInit {
  public buttonLabel = '';
  private _pluginState: PluginInstallState | undefined;
  private _plugin: PluginWithVersionStatus | undefined;

  @Input()
  set pluginInstalState(pluginState: PluginInstallState | undefined) {
    this._pluginState = pluginState;
    if (pluginState) {
      const { state } = pluginState;
      this.isProgressVisible = state !== 'FINISHED';
    } else {
      this.isProgressVisible = false;
    }
  }

  get pluginInstalState(): PluginInstallState | undefined {
    return this._pluginState;
  }

  @Input()
  set plugin(plugin: PluginWithVersionStatus | undefined) {
    this._plugin = plugin;
    if (plugin) {
      const { canInstall, canUpdate, canDeinstall } = plugin;
      if (canInstall || canUpdate || canDeinstall) {
        this.buttonLabel = canUpdate
          ? this.translateService.instant('PLUGIN.PROGRESSBAR.REFRESH')
          : this.translateService.instant('PLUGIN.PROGRESSBAR.INSTALL');
        this.showHost();
      } else {
        this.hideHost();
      }
    }
  }

  get plugin(): PluginWithVersionStatus | undefined {
    return this._plugin;
  }

  @Output()
  cancel = new EventEmitter<PluginModel>();

  @Output()
  deinstall = new EventEmitter<PluginModel>();

  @Output()
  update = new EventEmitter<PluginModel>();

  public isProgressVisible: boolean = false;

  constructor(
    private host: ElementRef,
    private translateService: TranslateService,
  ) {
    this.buttonLabel = this.translateService.instant('PLUGIN.PROGRESSBAR.REFRESH');
  }

  ngOnInit(): void {
    this.hideHost();
  }

  onCancel(): void {
    if (this.pluginInstalState?.plugin) {
      this.cancel.emit(this.pluginInstalState.plugin);
    }
  }

  onUpdate(): void {
    if (this.plugin) {
      this.update.emit(this.plugin);
    }
  }

  onDeinstall(): void {
    if (this.plugin) {
      this.deinstall.emit(this.plugin);
    }
  }

  private hideHost() {
    this.host.nativeElement.style.display = 'none';
  }

  private showHost() {
    this.host.nativeElement.style.display = 'block';
  }
}

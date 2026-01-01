import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  HostListener,
  OnInit,
  signal,
  Signal,
  ViewChild,
} from '@angular/core';
import { finalize, mergeMap, Observable, of, Subscription, tap } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ChannelList, PluginInstallState, PluginService, PluginWithVersionStatus } from './services/plugin.service';
import { PluginModel } from '../../plugin';
import { CommonModule } from '@angular/common';
import { isEmpty } from 'lodash';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PluginProgressbarComponent } from './progressbar/plugin-progressbar.component';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { pluginmanagerRoutes } from './pluginmanager.routes';
import { PluginListComponent } from './plugin-list/plugin-list.component';
import { DialogComponent } from '@ladon/shared';

@Component({
  standalone: true,
  selector: 'pluginmanager',
  imports: [CommonModule, RouterModule, PluginProgressbarComponent, FormsModule, TranslateModule, DialogComponent],
  templateUrl: './pluginmanager.component.html',
  styleUrl: './pluginmanager.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PluginmanagerComponent implements OnInit {
  @ViewChild('search') search!: ElementRef;
  @ViewChild(DialogComponent, { static: true }) dialog!: DialogComponent;
  hasSMBreakpoint = signal<boolean>(false);

  public pluginInstallList: { [key: string]: PluginInstallState } = {};
  public isLoading = true;
  public channels$: Observable<Array<ChannelList>>;
  public selectedChannel: string = '';
  public pluginInfoUrl$!: Signal<SafeResourceUrl>;

  isInstalling = false;
  selectedItem$: Observable<PluginWithVersionStatus | undefined>;
  filterText: string = '';

  private sub$: Subscription = new Subscription();
  private resizeObserver: ResizeObserver | undefined;

  @HostListener('document:keyup', ['$event'])
  handleHotKey(event: KeyboardEvent): void {
    if (event.key === 'F' && event.ctrlKey) {
      this.search.nativeElement.focus();
    }
  }

  constructor(
    private pluginService: PluginService,
    public sanitizer: DomSanitizer,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.selectedItem$ = this.pluginService.selectedPlugin;
    this.filterText = '';
    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect) {
          const width = entry.contentRect.width;

          if (width < 768) {
            this.hasSMBreakpoint.set(true);
          } else {
            this.hasSMBreakpoint.set(false);
          }
        }
      }
    });
    this.resizeObserver.observe(document.body);

    this.channels$ = this.pluginService.getPluginChannels().pipe(
      tap((channels) => {
        if (channels && Array.isArray(channels) && channels.length > 0) {
          this.changeChannel(channels[0].channel);
        } else {
          this.isLoading = false;
        }
      }),
    );
  }

  ngOnInit(): void {
    this.pluginInfoUrl$ = computed(() =>
      this.sanitizer.bypassSecurityTrustResourceUrl(this.pluginService.pluginInfoUrl()),
    );

    this.pluginService.selectedPlugin.subscribe((selected) => {
      if (selected && this.hasSMBreakpoint()) {
        this.dialog.openDialog();
      }
    });

    this.getInstalling();
  }

  private getInstalling(): void {
    this.pluginService
      .isInstalling()
      .pipe(
        tap(() => (this.isInstalling = true)),
        mergeMap((data) => {
          this.pluginInstallList = data;
          if (isEmpty(this.pluginInstallList)) {
            this.isInstalling = false;
            return this.pluginService.plugins();
          }
          return of(undefined);
        }),
      )
      .subscribe((plugins) => {
        /*        if (plugins) {
                    if (this.selectedItem?.id) {
                      this.onSelect(this.findCurrentSelectedItemFromPayload(plugins, this.selectedItem.id));
                    }
                  }*/
      });
  }

  ngOnDestroy(): void {
    //   this.webbundle = undefined;
    //   this.bundleContent = undefined;
  }

  changeChannel(channel: string): void {
    if (channel && channel !== this.selectedChannel) {
      this.isLoading = true;
      this.selectedChannel = channel;
      this.pluginService.changeChannel(channel);
    }
    this.router.navigate([channel], { relativeTo: this.route });
  }

  showBundle(bundle: any): void {
    if (!bundle) {
      return;
    }
    this.pluginService.getPluginDescription(bundle.id).subscribe((result) => {
      if (result) {
        //  this.selectedItem = bundle;
        //    this.iFrameSrc = this.sanitizer.bypassSecurityTrustResourceUrl(result);
      }
    });
  }

  install(plugin: PluginModel): void {
    if (!plugin) {
      return;
    }
    if (plugin.spec?.type === 'web-bundle') {
      this.installBundle(plugin);
    } else {
      if (this.prepareAction(plugin)) {
        this.sub$.add(
          this.pluginService
            .installPlugin(plugin)
            .pipe(
              finalize(() => {
                this.isInstalling = false;
              }),
            )
            .subscribe(),
        );
      }
    }
  }

  deinstall(plugin: PluginModel): void {
    if (this.prepareAction(plugin)) {
      this.sub$.add(
        this.pluginService
          .deintallPlugin(plugin)
          .pipe(
            finalize(() => {
              this.isInstalling = false;
            }),
          )
          .subscribe(),
      );
    }
  }

  private installBundle(plugin: PluginModel): void {
    if (this.prepareAction(plugin)) {
      this.sub$ = this.pluginService
        .installBundle(plugin)
        .pipe(
          finalize(() => {
            //this.loader.hide();
            this.isInstalling = false;
          }),
        )
        .subscribe((result) => {
          console.log(result);
        });
    }
  }

  private prepareAction(plugin: PluginModel): boolean {
    if (!plugin) {
      return false;
    }
    if (this.sub$) {
      this.sub$.unsubscribe();
    }
    return true;
  }
}

import {Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import { finalize, mergeMap, Observable, of, Subscription, tap } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ChannelList, PluginInstallState, PluginService, PluginWithVersionStatus } from './services/plugin.service';
import { PluginModel } from '../../plugin';
import { CommonModule } from '@angular/common';
import { isEmpty } from 'lodash';
import { FormsModule } from '@angular/forms';
import { SearchfilterPipe } from './pipe/searchfilter.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { PluginProgressbarComponent } from './progressbar/plugin-progressbar.component';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import { pluginmanagerRoutes } from './pluginmanager.routes';
import {PluginListComponent} from "./plugin-list/plugin-list.component";

@Component({
  selector: 'pluginmanager',
  standalone: true,
  imports: [CommonModule, RouterModule,
    PluginProgressbarComponent,
    PluginListComponent,
    FormsModule,
    SearchfilterPipe,
    TranslateModule],
  templateUrl: './pluginmanager.component.html',
  styleUrl: './pluginmanager.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PluginmanagerComponent implements OnInit {
  constructor(
    private pluginService: PluginService,
    public sanitizer: DomSanitizer,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.channels$ = this.pluginService.getPluginChannels().pipe(
      tap((channels) => {
        if (channels) {
          this.selectedChannel = channels[0].channel;
        } else {
          this.isLoading = false;
        }
      })
    );
  }

  @ViewChild('search') search!: ElementRef;
  @ViewChild('dialog') dialog!: ElementRef;

  public pluginInstallList: { [key: string]: PluginInstallState } = {};
  public isEmpty = true;
  public isLoading = true;
  public pluginlist: Array<PluginWithVersionStatus> = [];
  public channels$: Observable<Array<ChannelList>>;
  public selectedChannel: string = '';

  iFrameSrc!: SafeResourceUrl;
  isInstalling = false;
  selectedItem: PluginWithVersionStatus | undefined;
  filterText = '';

  private sub$: Subscription = new Subscription();

  @HostListener('document:keyup', ['$event'])
  handleHotKey(event: KeyboardEvent): void {
    if (event.key === 'F' && event.ctrlKey) {
      this.search.nativeElement.focus();
    }
  }

  ngOnInit(): void {
    this.iFrameSrc = this.sanitizer.bypassSecurityTrustResourceUrl('https://ladon.org');
    this.getInstalling();
  }


  private findCurrentSelectedItemFromPayload(
    payload: PluginWithVersionStatus[],
    currentId: string,
  ): PluginWithVersionStatus | undefined {
    if (payload instanceof Array) {
      return payload.find((plugin) => plugin.id === currentId);
    }

    throw TypeError(`Please pass in array for ${payload}`);
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
            //this.loader.show();
            return this.pluginService.reloadPlugin();
          }
          return of(undefined);
        }),
      )
      .subscribe((plugins) => {
        if (plugins) {
          if (this.selectedItem?.id) {
            this.onSelect(this.findCurrentSelectedItemFromPayload(plugins, this.selectedItem.id));
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.pluginlist = [];
    //   this.webbundle = undefined;
    //   this.bundleContent = undefined;
  }

  private get checkForOpenDialog(): boolean {
    return this.dialog.nativeElement.hasAttribute('open');
  }

  onSelect(item: PluginWithVersionStatus | undefined): void {
    if (!item) {
      return;
    }
    this.selectedItem = item;
    this.iFrameSrc = this.sanitizer.bypassSecurityTrustResourceUrl(this.pluginService.getDocsUrl(item.id));
    if (this.isMinWidth(780)) {
      return;
    }

    if (!this.checkForOpenDialog) {
      this.dialog.nativeElement.showModal();
    }
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
        this.selectedItem = bundle;
        this.iFrameSrc = this.sanitizer.bypassSecurityTrustResourceUrl(result);
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
                //this.loader.hide();
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
              //this.loader.hide();
              this.isInstalling = false;
            }),
          )
          .subscribe(),
      );
    }
  }

  private isMinWidth(minWidth: number): boolean {
    if (isNaN(minWidth)) {
      throw TypeError(`Passed parameter should be a number`);
    }
    return window.innerWidth >= minWidth;
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
    //this.loader.show();
    return true;
  }
}

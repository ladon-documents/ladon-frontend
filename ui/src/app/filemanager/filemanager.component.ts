import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { SearchbarComponent } from '../searchbar/searchbar.component';
import { filemanagerRoutes } from './filemanager.routes';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FilemanagerFacade } from './filemanager.facade';
import { FilemanagerStore } from '../store/filemanager.store';
import { SidebarComponent } from './sidebar/sidebar.component';
import { heroDocument, heroFolder, heroPlus } from '@ng-icons/heroicons/outline';
import { FilesizePipe } from '../shared/pipes/filesize.pipe';
import { BucketStatsExtended } from '../interfaces/bucket-stats';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { FileUploaderComponent } from './file-uploader/file-uploader.component';
import { CreateFolderComponent } from './create-folder/create-folder.component';

@Component({
  standalone: true,
  selector: 'filemanager',
  imports: [
    CommonModule,
    RouterModule,
    NgIconComponent,
    BreadcrumbComponent,
    FileUploaderComponent,
    CreateFolderComponent,
    SidebarComponent
  ],
  providers: [
    provideIcons({
      heroPlus,
      heroDocument,
      heroFolder,
    }),
    FilesizePipe,
  ],
  templateUrl: './filemanager.component.html',
  styleUrl: './filemanager.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FilemanagerComponent implements OnInit {
  private readonly filemanagerFacade = inject(FilemanagerFacade);
  readonly selectedBucket: Signal<string | null> = this.filemanagerFacade.selectedBucket;
  readonly error: Signal<string | null> = this.filemanagerFacade.error;
  readonly stats: Signal<BucketStatsExtended | null> = this.filemanagerFacade.statistics;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    /*
    if (this.route.firstChild === null) {
      try {
        const defaultBucketId = await this.#bucketsService.ensureDefaultBucket();
        this.router.navigate([defaultBucketId], { relativeTo: this.route });
      } catch (error) {
        console.error('Fehler beim Laden/Erstellen des Standard-Buckets:', error);
      }
    }

     */
    if (this.route.firstChild === null) {
      console.log('route is null');
    }

    if (this.selectedBucket()) {
      this.filemanagerFacade.loadStats();
      this.router.navigate([this.selectedBucket()], { relativeTo: this.route });
    }
  }

  protected readonly heroDocument = heroDocument;
  protected readonly heroFolder = heroFolder;
}

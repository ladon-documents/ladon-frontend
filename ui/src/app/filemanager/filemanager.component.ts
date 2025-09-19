import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FilemanagerFacade } from './filemanager.facade';
import { SidebarComponent } from './sidebar/sidebar.component';
import { heroDocument, heroEye, heroFolder, heroPlus } from '@ng-icons/heroicons/outline';
import { FilesizePipe } from '../shared/pipes/filesize.pipe';
import { BucketStatsExtended } from '../interfaces/bucket-stats';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { FileUploaderComponent } from './file-uploader/file-uploader.component';
import { CreateFolderComponent } from './create-folder/create-folder.component';
import { SidebarService } from './sidebar/sidebar.service';
import { FileEditorDialogComponent } from './file-editor-dialog/file-editor-dialog.component';
import { filemanagerRoutes } from './filemanager.routes';

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
    SidebarComponent,
    FileEditorDialogComponent,
  ],
  providers: [
    provideIcons({
      heroPlus,
      heroDocument,
      heroFolder,
      heroEye,
    }),
    FilesizePipe,
  ],
  templateUrl: './filemanager.component.html',
  styleUrl: './filemanager.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FilemanagerComponent implements OnInit {
  private readonly filemanagerFacade = inject(FilemanagerFacade);
  sidebarService = inject(SidebarService);

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

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  protected readonly heroDocument = heroDocument;
  protected readonly heroFolder = heroFolder;
}

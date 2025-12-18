import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons, provideNgIconsConfig } from '@ng-icons/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FilemanagerFacade } from './filemanager.facade';
import { SidebarComponent } from './sidebar/sidebar.component';
import {
  heroBars3,
  heroBars3BottomLeft,
  heroCalendarDays,
  heroChevronDown,
  heroChevronUp,
  heroClock,
  heroDocument,
  heroDocumentDuplicate,
  heroDocumentText,
  heroEye,
  heroFolder,
  heroMagnifyingGlass,
  heroPlus,
  heroScale,
  heroSquares2x2,
  heroXMark,
} from '@ng-icons/heroicons/outline';
import { FilesizePipe } from '../shared/pipes/filesize.pipe';
import { BucketStatsExtended } from '../interfaces/bucket-stats';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { FileUploaderComponent } from './file-uploader/file-uploader.component';
import { CreateFolderComponent } from './create-folder/create-folder.component';
import { SidebarService } from './sidebar/sidebar.service';
import { FileEditorDialogComponent } from './file-editor-dialog/file-editor-dialog.component';
import { filemanagerRoutes } from './filemanager.routes';
import { SearchModalComponent } from '../shared/components/search-modal/search-modal.component';
import { BucketUiItemModel } from '../../api';

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
    SearchModalComponent,
  ],
  providers: [
    provideNgIconsConfig({
      size: '1.5em',
      color: 'primary',
    }),
    provideIcons({
      heroPlus,
      heroDocument,
      heroFolder,
      heroEye,
      heroBars3,
      heroSquares2x2,
      heroMagnifyingGlass,
      heroXMark,
      heroBars3BottomLeft,
      heroChevronDown,
      heroDocumentText,
      heroScale,
      heroDocumentDuplicate,
      heroClock,
      heroCalendarDays,
      heroChevronUp,
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
  isSearchModalOpen = signal(false);

  viewMode = this.filemanagerFacade.viewMode;
  readonly searchTerm = this.filemanagerFacade.searchTerm;
  readonly sortConfig = this.filemanagerFacade.sortConfig;
  readonly pagination = this.filemanagerFacade.pagination;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.initKeyDownListener()
  }

  ngOnInit() {
    if (this.route.firstChild === null) {
      console.log('route is null');
    }

    if (this.selectedBucket()) {
      this.filemanagerFacade.loadStats();
      this.router.navigate([this.selectedBucket()], { relativeTo: this.route });
    }
  }

  setViewMode(viewMode: 'card' | 'table') {
    this.filemanagerFacade.setViewMode(viewMode);
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  // Neue Such- und Sortiermethoden
  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.filemanagerFacade.setSearchTerm(target.value);
  }

  clearSearch() {
    this.filemanagerFacade.clearSearch();
  }

  toggleSort(field: 'name' | 'size' | 'type' | 'last-modified' | 'created') {
    this.filemanagerFacade.toggleSort(field);
  }

  private initKeyDownListener() {
    document.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        this.openSearchModal();
      }
    });
  }


  openSearchModal() {
    this.isSearchModalOpen.set(true);
  }

  closeSearchModal() {
    this.isSearchModalOpen.set(false);
  }

  onBucketSelected(bucket: BucketUiItemModel) {
    console.log('Selected bucket:', bucket);
    this.filemanagerFacade.loadBucket(bucket.id as string);
  }

  protected readonly heroDocument = heroDocument;
  protected readonly heroFolder = heroFolder;
}

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
  heroCloudArrowUp,
  heroClock,
  heroDocumentDuplicate,
  heroDocumentText,
  heroEye,
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
import { SearchModalComponent } from '../shared/components/search-modal/search-modal.component';
import { BucketUiItemModel } from '../../api';
import { CreateNewFileComponent } from './create-new-file/create-new-file.component';
import { FilemanagerWorkspaceService } from './filemanager-workspace.service';
import { FilemanagerWorkspaceViewComponent } from './workspace-view/workspace-view.component';

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
    SearchModalComponent,
    CreateNewFileComponent,
    FilemanagerWorkspaceViewComponent,
  ],
  providers: [
    provideNgIconsConfig({
      size: '1.5em',
      color: 'primary',
    }),
    provideIcons({
      heroPlus,
      heroEye,
      heroBars3,
      heroSquares2x2,
      heroMagnifyingGlass,
      heroXMark,
      heroBars3BottomLeft,
      heroChevronDown,
      heroCloudArrowUp,
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
  readonly workspaceService = inject(FilemanagerWorkspaceService);
  sidebarService = inject(SidebarService);

  readonly selectedBucket: Signal<string | null> = this.filemanagerFacade.selectedBucket;
  readonly error: Signal<string | null> = this.filemanagerFacade.error;
  readonly stats: Signal<BucketStatsExtended | null> = this.filemanagerFacade.statistics;
  isSearchModalOpen = signal(false);

  viewMode = this.filemanagerFacade.viewMode;
  readonly searchTerm = this.filemanagerFacade.searchTerm;
  readonly sortConfig = this.filemanagerFacade.sortConfig;
  readonly pagination = this.filemanagerFacade.pagination;
  readonly workspaceMode = this.workspaceService.mode;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.initKeyDownListener();
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

  toggleViewMode() {
    const currentMode = this.viewMode();
    const newMode = currentMode === 'card' ? 'table' : 'card';
    this.filemanagerFacade.setViewMode(newMode);
  }

  toggleClipboardMode() {
    this.sidebarService.toggleClipboardMode();
  }

  togglePreviewMode() {
    this.sidebarService.togglePreviewMode();
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
  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      // Weiterleitung an die Upload-Logik
      //files.forEach(file => this.uploadFile(file));

      // Input zurücksetzen für wiederholte Uploads derselben Datei
      input.value = '';
    }
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
}

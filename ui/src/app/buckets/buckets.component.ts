
import { Component, computed, inject, OnInit, signal, Signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons, provideNgIconsConfig } from '@ng-icons/core';
import {
  heroFolder,
  heroPlusCircle,
  heroMagnifyingGlass,
  heroXMark,
  heroFunnel,
  heroChevronUp,
  heroChevronDown,
  heroChevronLeft,
  heroChevronRight,
  heroChevronDoubleLeft,
  heroChevronDoubleRight,
  heroStar,
  heroEye,
  heroPencilSquare,
  heroTrash,
  heroEllipsisVertical,
  heroExclamationTriangle
} from '@ng-icons/heroicons/outline';
import { heroFolderSolid, heroStarSolid } from '@ng-icons/heroicons/solid';
import { BucketsFacade } from './buckets.facade';
import { TranslateModule } from '@ngx-translate/core';
import { DialogComponent } from '@ladon/shared';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SortConfig } from '../store/bucket.store';
import { BucketUiItemModel } from '../../api';
import { LadonRouterService } from '../services/ladon-router.service';

@Component({
  selector: 'buckets',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIconComponent,
    TranslateModule,
    DialogComponent
  ],
  providers: [
    provideIcons({
      heroFolder,
      heroPlusCircle,
      heroFolderSolid,
      heroMagnifyingGlass,
      heroXMark,
      heroFunnel,
      heroChevronUp,
      heroChevronDown,
      heroChevronLeft,
      heroChevronRight,
      heroChevronDoubleLeft,
      heroChevronDoubleRight,
      heroStar,
      heroStarSolid,
      heroEye,
      heroPencilSquare,
      heroTrash,
      heroEllipsisVertical,
      heroExclamationTriangle,
    })
  ],
  templateUrl: './buckets.component.html',
  styleUrl: './buckets.component.scss',
})
export class BucketsComponent implements OnInit {
  @ViewChild(DialogComponent, { static: true }) dialogComponent!: DialogComponent | undefined;

  private readonly bucketsFacade = inject(BucketsFacade);
  private readonly ladonRouter = inject(LadonRouterService);

  // Form
  bucketAddGroup = new FormGroup({
    bucket: new FormControl('', [Validators.required]),
  });

  // Properties
  dateFormat = 'dd.MM.yyyy';

  // Store Selectors
  readonly buckets = this.bucketsFacade.buckets;
  readonly selectedBucket = this.bucketsFacade.selectedBucket;
  readonly bucketStats = this.bucketsFacade.bucketStats;
  readonly isLoading =  signal(false) // this.bucketsFacade.isLoading;
  readonly error = this.bucketsFacade.error;
  readonly searchTerm = this.bucketsFacade.searchTerm;
  readonly showFavoritesOnly = this.bucketsFacade.showFavoritesOnly;
  readonly sortConfig = this.bucketsFacade.sortConfig;
  readonly pagination = this.bucketsFacade.pagination;

  // Helper computed properties
  readonly hasBuckets = this.bucketsFacade.hasBuckets;
  readonly hasSelectedBucket = this.bucketsFacade.hasSelectedBucket;

  // Math reference for template
  readonly Math = Math;

  ngOnInit() {
    this.loadBuckets();
  }

  // Data Loading
  loadBuckets() {
    this.bucketsFacade.loadBuckets();
  }

  retryLoad() {
    this.loadBuckets();
  }

  // Selection
  selectBucket(bucket: BucketUiItemModel) {
    this.bucketsFacade.selectBucket(bucket);
  }

  async openBucket() {
    const selected = this.selectedBucket();
    if (selected?.id) {
      await this.ladonRouter.navigateToFilemanagerWithBucket(selected.id);
    }
  }

  // Search
  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.bucketsFacade.setSearchTerm(target.value);
  }

  clearSearch() {
    this.bucketsFacade.clearSearch();
  }

  clearFilters() {
    this.bucketsFacade.clearSearch();
    this.bucketsFacade.toggleFavoritesFilter(false);
  }

  // Favorites
  toggleFavoritesFilter(event: Event) {
    const target = event.target as HTMLInputElement;
    this.bucketsFacade.toggleFavoritesFilter(target.checked);
  }

  toggleFavorite(event: Event, bucketId: string | undefined) {
    event.stopPropagation();
    if (!bucketId) return
    this.bucketsFacade.toggleBucketFavorite(bucketId);
  }

  // Sorting
  toggleSort(field: SortConfig['field']) {
    this.bucketsFacade.toggleSort(field);
  }

  getSortLabel(): string {
    const config = this.sortConfig();
    const labels: Record<SortConfig['field'], string> = {
      id: 'Name',
      size: 'Größe',
      created: 'Erstellt',
      createdBy: 'Erstellt von',
      createdDate: 'Erstellt am',
      favourite: 'Favoriten'
    };
    return labels[config.field] || 'Name';
  }

  // Pagination
  goToPage(page: number) {
    this.bucketsFacade.goToPage(page);
  }

  nextPage() {
    this.bucketsFacade.nextPage();
  }

  previousPage() {
    this.bucketsFacade.previousPage();
  }

  firstPage() {
    this.bucketsFacade.firstPage();
  }

  lastPage() {
    this.bucketsFacade.lastPage();
  }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const pageSize = parseInt(target.value, 10);
    this.bucketsFacade.setPageSize(pageSize);
  }

  // CRUD Operations
  onAddBucket() {
    if (this.bucketAddGroup.invalid) {
      this.bucketAddGroup.markAllAsTouched();
      return;
    }

    const bucketName = this.bucketAddGroup.get('bucket')?.value;
    if (bucketName) {
      this.bucketsFacade.createBucket(bucketName);
      this.bucketAddGroup.reset();
      this.closeDialog();
    }
  }

  renameBucket(bucket: BucketUiItemModel) {
    // TODO: Implement rename functionality
    // This would typically open a dialog or inline edit
    console.log('Rename bucket:', bucket.id);
  }

  deleteBucket(bucket: BucketUiItemModel) {
    // TODO: Add confirmation dialog
    if (!bucket.id) return;
    if (confirm(`Sind Sie sicher, dass Sie das Bucket "${bucket.id}" löschen möchten?`)) {
      this.bucketsFacade.deleteBucket(bucket.id);
    }
  }

  // Dialog Management
  closeDialog() {
    this.dialogComponent?.closeDialog();
    this.bucketAddGroup.reset();
  }

  // Event Handlers for preventing propagation
  onRowClick(bucket: BucketUiItemModel, event: Event) {
    // Only select if not clicking on action buttons
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown') && !target.closest('button')) {
      this.selectBucket(bucket);
    }
  }

  onRowDoubleClick(bucket: BucketUiItemModel, event: Event) {
    // Only open if not clicking on action buttons
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown') && !target.closest('button')) {
      this.selectBucket(bucket);
      this.openBucket();
    }
  }
}

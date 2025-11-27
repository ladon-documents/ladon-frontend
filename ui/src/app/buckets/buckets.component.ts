import { Component, computed, OnInit, signal, Signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroFolder, heroPlusCircle } from '@ng-icons/heroicons/outline';
import { heroFolderSolid } from '@ng-icons/heroicons/solid';
import { BucketsService } from './buckets.service';
import { SearchbarComponent } from '../searchbar/searchbar.component';
import { BucketsTestObject } from '@ladon/tests/buckets-test-object';
import { BucketUiItemModel } from '../../api';
import { TranslateModule } from '@ngx-translate/core';
import { BucketStatsExtended } from '../interfaces/bucket-stats';
import { Router } from '@angular/router';
import { DialogComponent, FolderComponent } from '@ladon/shared';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'buckets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIconComponent, SearchbarComponent, TranslateModule, DialogComponent, FolderComponent],
  providers: [provideIcons({ heroFolder, heroPlusCircle, heroFolderSolid }), BucketsService, BucketsTestObject],
  templateUrl: './buckets.component.html',
  styleUrl: './buckets.component.scss',
})
export class BucketsComponent implements OnInit {
  @ViewChild(DialogComponent, { static: true }) dialogComponent!: DialogComponent | undefined;

  dateFormat = 'dd.MM.yyyy';
  bucketsList: Signal<BucketUiItemModel[]> = signal([]);
  bucketStats: Signal<BucketStatsExtended | undefined> = signal<BucketStatsExtended | undefined>(undefined);
  bucketAddGroup = new FormGroup({
    bucket: new FormControl('', [Validators.required]),
  });
  selectedBucket: BucketUiItemModel | undefined;

  constructor(
    public bucketsService: BucketsService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.bucketsList = computed(() => this.bucketsService.bucketList());
    this.bucketStats = computed(() => this.bucketsService.bucketStats());
  }

  selectBucket(bucket: BucketUiItemModel) {
    this.selectedBucket = bucket;
    this.bucketsService.bucket = bucket;
  }

  openBucket() {
    if (this.selectedBucket && this.selectedBucket.id) {
      this.bucketsService.dispatchSelectedBucket(this.selectedBucket.id);
    }
  }

  toggleFavorites(event: any) {
    const { target } = event;
    this.bucketsService.toggleFavoriteBuckets(target.checked);
  }

  closeDialog() {
    this.dialogComponent?.closeDialog();
  }

  onAddBucket() {
    if (this.bucketAddGroup.invalid) {
      this.bucketAddGroup.markAllAsTouched();
      return;
    }

    const { bucket } = this.bucketAddGroup.value;
    // this.bucketsService.addBucket(bucket);
    this.closeDialog();
  }
}

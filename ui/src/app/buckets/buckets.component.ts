import { Component, computed, OnInit, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroFolder, heroPlusCircle } from '@ng-icons/heroicons/outline';
import { heroFolderSolid } from '@ng-icons/heroicons/solid';
import { BucketsService } from './buckets.service';
import { SearchbarComponent } from '../searchbar/searchbar.component';
import { BucketsTestObject } from '@ladon/tests/buckets-test-object';
import { BucketStatisticsModel, BucketUiItemModel, StatisticsModel } from '../../api';
import { TranslateModule } from '@ngx-translate/core';
import { BucketStatsExtended } from '../interfaces/bucket-stats';

@Component({
  selector: 'buckets',
  standalone: true,
  imports: [CommonModule, NgIconComponent, SearchbarComponent, TranslateModule],
  providers: [provideIcons({ heroFolder, heroPlusCircle, heroFolderSolid }), BucketsService, BucketsTestObject],
  templateUrl: './buckets.component.html',
  styleUrl: './buckets.component.scss',
})
export class BucketsComponent implements OnInit {
  dateFormat = 'dd.MM.yyyy';
  bucketsList: Signal<BucketUiItemModel[]> = signal([]);
  bucketStats: Signal<BucketStatsExtended | undefined> = signal<BucketStatsExtended | undefined>(undefined);
  selectedBucket: BucketUiItemModel | undefined;

  constructor(public bucketsService: BucketsService) {}

  ngOnInit() {
    this.bucketsList = computed(() => this.bucketsService.bucketList());
    this.bucketStats = computed(() => this.bucketsService.bucketStats());
  }

  selectBucket(bucket: BucketUiItemModel) {
    this.selectedBucket = bucket;
    this.bucketsService.bucket = bucket;
  }

  toggleFavorites(event: any) {
    const { target } = event;
    this.bucketsService.toggleFavoriteBuckets(target.checked);
  }
}

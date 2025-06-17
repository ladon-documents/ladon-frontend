import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, Subject, mergeMap, of, take } from 'rxjs';
import { BucketStatsExtended } from '../interfaces/bucket-stats';
import {
  BucketModel,
  BucketsService as BucketsServiceApi,
  BucketUiItemModel,
  DocumentsService,
  UIService,
} from '../../api';
import { FilemanagerStore } from '../store/filemanager.store';
import { LadonRouterService } from '../services/ladon-router.service';

@Injectable({
  providedIn: 'root',
})
export class BucketsService {
  readonly #filemanagerStore = inject(FilemanagerStore);
  private bucketsListSignal = signal<BucketUiItemModel[]>([]);
  private bucketStatsSignal = signal<BucketStatsExtended | undefined>(undefined);
  private _bucketList = signal<BucketUiItemModel[]>([]);
  constructor(
    private bucketServiceApi: BucketsServiceApi,
    private documentsService: DocumentsService,
    private uiServiceApi: UIService,
    private ladonRouterService: LadonRouterService,
  ) {
    this.retrieveBucketsList();
  }

  get bucketList() {
    return this.bucketsListSignal.asReadonly();
  }

  get bucketStats() {
    return this.bucketStatsSignal.asReadonly();
  }

  toggleFavoriteBuckets(isFavorite: boolean) {
    if (isFavorite) {
      const filteredBucketList = this._bucketList()?.filter(
        (bucket: BucketUiItemModel) => bucket.favourite === isFavorite,
      ) as BucketUiItemModel[];
      this.bucketsListSignal.set(filteredBucketList);
    } else {
      this.bucketsListSignal.set(this._bucketList() as BucketUiItemModel[]);
    }
  }

  dispatchSelectedBucket(bucket: string) {
    this.#filemanagerStore.navigateToFilemanagerWithBucket(bucket);
  }

  set bucket(bucket: BucketUiItemModel) {
    if (!bucket?.id) return;
    this.getStats(bucket.id)
      .pipe(take(1))
      .subscribe(async (stats) => {
        const response = JSON.parse(await stats.text());
        response.favourite = bucket.favourite;
        this.bucketStatsSignal.set(response);
        console.log(response);
      });
  }

  private retrieveBucketsList(): void {
    this.uiServiceApi
      .listBuckets()
      .pipe(take(1))
      .subscribe((buckets) => {
        this._bucketList.set(buckets);
        this.bucketsListSignal.set(buckets);
      });
  }

  private getStats(bucketId: string) {
    return this.documentsService.getDocument('_proc', `bucket-stats/${bucketId}/stats.json`);
  }
}

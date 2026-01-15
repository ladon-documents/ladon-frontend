import { inject, Injectable, signal } from '@angular/core';
import { take } from 'rxjs';
import { BucketStatsExtended } from '../interfaces/bucket-stats';
import {
  BucketsService as BucketsServiceApi,
  BucketUiItemModel,
  DocumentsService,
  NewBucketModel,
  UIService,
} from '../../api';
import { FilemanagerStore } from '../store/filemanager.store';
import { LadonRouterService } from '../services/ladon-router.service';

@Injectable({
  providedIn: 'root',
})
export class BucketsService {
  readonly #filemanagerStore = inject(FilemanagerStore);
  readonly bucketsService = inject(BucketsServiceApi);
  readonly uiService = inject(UIService);
  private bucketsListSignal = signal<BucketUiItemModel[]>([]);
  private bucketStatsSignal = signal<BucketStatsExtended | undefined>(undefined);
  private _bucketList = signal<BucketUiItemModel[]>([]);

  constructor(
    private documentsService: DocumentsService,
    private ladonRouterService: LadonRouterService,
  ) {}

  getBuckets() {
    return this.uiService.listBuckets();
  }

  createBucket(bucketid: string) {
    const newBucket: NewBucketModel = {
      bucketid,
      versioned: 'false',
      favourite: 'false',
    };
    return this.uiService.createBucket1(newBucket);
  }

  searchBuckets(bucketName: string) {
    return this.uiService.listBuckets(bucketName);
  }

  deleteBucket(bucketId: string) {
    return this.bucketsService.deleteBucket(bucketId);
  }
  public getStats(bucketId: string) {
    return this.documentsService.getDocument('_proc', `bucket-stats/${bucketId}/stats.json`);
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
      });
  }
}

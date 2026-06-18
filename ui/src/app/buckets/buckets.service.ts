import { inject, Injectable, signal } from '@angular/core';
import { take } from 'rxjs';
import { BucketStatsExtended } from '../interfaces/bucket-stats';
import { BucketUiItemModel, NewBucketModel } from '@ladon/api';
import { FilemanagerStore } from '../store/filemanager.store';
import { LadonRouterService } from '../services/ladon-router.service';
import { FetchApiFactory } from '../services/api/fetch-api.factory';

@Injectable({
  providedIn: 'root',
})
export class BucketsService {
  readonly #filemanagerStore = inject(FilemanagerStore);
  readonly apiFactory = inject(FetchApiFactory);
  private bucketsListSignal = signal<BucketUiItemModel[]>([]);
  private bucketStatsSignal = signal<BucketStatsExtended | undefined>(undefined);
  private _bucketList = signal<BucketUiItemModel[]>([]);

  constructor(private ladonRouterService: LadonRouterService) {}

  getBuckets() {
    return this.apiFactory.fromApi(() => this.apiFactory.uiApi.listBuckets({}) as Promise<BucketUiItemModel[]>);
  }

  createBucket(bucketid: string) {
    const newBucket: NewBucketModel = {
      bucketid,
      versioned: 'false',
      favourite: 'false',
    };
    return this.apiFactory.fromApi(() => this.apiFactory.uiApi.createBucket1({ bucket: newBucket as any }));
  }

  searchBuckets(bucketName: string) {
    return this.apiFactory.fromApi(
      () =>
        this.apiFactory.uiApi.listBuckets({
          filter: bucketName,
        }) as Promise<BucketUiItemModel[]>,
    );
  }

  deleteBucket(bucketId: string) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.bucketsApi.deleteBucket({
        bucket: bucketId,
      }),
    );
  }

  public getStats(bucketId: string) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.documentsApi.getDocument({
        bucket: '_proc',
        key: `bucket-stats/${bucketId}/stats.json`,
      }),
    );
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

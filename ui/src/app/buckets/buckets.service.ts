import { Injectable } from '@angular/core';
import { BucketItem } from '../interfaces/bucket-item';
import { BehaviorSubject, Observable, Subject, mergeMap, of } from 'rxjs';
import { BucketStats } from '../interfaces/bucket-stats';
import { BucketModel, BucketsService as BucketsServiceApi } from '../../api';

@Injectable({
  providedIn: 'root',
})
export class BucketsService {
  bucketsListBehaviorSubject = new BehaviorSubject<BucketModel[] | undefined>(this.fetchBuckets());
  selectedBucketSubject = new Subject<BucketModel>();

  constructor(private bucketServiceApi: BucketsServiceApi) {}

  fetchBuckets(): BucketModel[] {
    return []; //  this.bucketServiceApi.listBuckets();
  }

  retrieveBucketsList(): Observable<BucketModel[]> {
    return this.bucketServiceApi.listBuckets(); //this.bucketsListBehaviorSubject.asObservable();
  }

  /*
	retrieveBucketStats(): Observable<any> {
		return this.selectedBucketSubject.asObservable().pipe(
			mergeMap((payload: BucketItem) => {
				const stats: BucketStats = this.bucketsTO.getBucketStats();
				return of({ ...payload, ...stats });
			})
		);
	}

	 */
}

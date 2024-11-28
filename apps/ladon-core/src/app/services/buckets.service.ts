import { Injectable } from "@angular/core";
import { BucketItem } from "../interfaces/bucket-item";
import { BehaviorSubject, Observable, Subject, mergeMap, of } from "rxjs";
import { BucketsTestObject } from "apps/ladon-core/tests/buckets-test-object";
import { BucketStats } from "../interfaces/bucket-stats";

@Injectable({
	providedIn: "root",
})
export class BucketsService {
	bucketsListBehaviorSubject = new BehaviorSubject<BucketItem[] | undefined>(this.fetchBuckets());
	selectedBucketSubject = new Subject<BucketItem>();

	constructor(private bucketsTO: BucketsTestObject) {}

	fetchBuckets(): BucketItem[] {
		// TODO: Make this a real api call
		return this.bucketsTO.getBucketsMock();
	}

	retrieveBucketsList(): Observable<BucketItem[] | undefined> {
		return this.bucketsListBehaviorSubject.asObservable();
	}

	retrieveBucketStats(): Observable<any> {
		return this.selectedBucketSubject.asObservable().pipe(
			mergeMap((payload: BucketItem) => {
				const stats: BucketStats = this.bucketsTO.getBucketStats();
				return of({ ...payload, ...stats });
			})
		);
	}
}

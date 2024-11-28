import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import { heroFolder, heroPlusCircle } from "@ng-icons/heroicons/outline";
import { heroFolderSolid } from "@ng-icons/heroicons/solid";
import { BucketItem } from "../interfaces/bucket-item";
import { SearchbarComponent } from "@ladon/searchbar";
import { BucketsService } from "../services/buckets.service";
import { Observable } from "rxjs";
import { BucketsTestObject } from "apps/ladon-core/tests/buckets-test-object";

@Component({
	selector: "buckets",
	standalone: true,
	imports: [CommonModule, NgIconComponent, SearchbarComponent],
	providers: [provideIcons({ heroFolder, heroPlusCircle, heroFolderSolid }), BucketsService, BucketsTestObject],
	templateUrl: "./buckets.component.html",
	styleUrl: "./buckets.component.scss",
})
export class BucketsComponent implements OnInit {
	dateFormat = "dd.MM.yyyy";
	bucketsList$: Observable<BucketItem[] | undefined> | undefined;
	selectedBucket: BucketItem | undefined;
	bucketStats$: Observable<any> | undefined;

	private _bucketsList: BucketItem[] | undefined;

	constructor(public bucketsService: BucketsService) {}

	ngOnInit() {
		// TODO: Make this a real api call
		this.bucketsList$ = this.bucketsService.retrieveBucketsList();
		this.bucketStats$ = this.bucketsService.retrieveBucketStats();
		this._bucketsList = this.bucketsService.bucketsListBehaviorSubject.getValue();
	}

	selectBucket(bucket: BucketItem) {
		this.selectedBucket = bucket;
		this.bucketsService.selectedBucketSubject.next(bucket);
	}

	toggleFavorites(event: any) {
		const { target } = event;
		if (target.checked) {
			this.bucketsService.bucketsListBehaviorSubject.next(
				this._bucketsList?.filter((bucket: BucketItem) => bucket.favourite === target.checked) as BucketItem[]
			);
		} else {
			this.bucketsService.bucketsListBehaviorSubject.next(this._bucketsList);
		}
	}
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroFolder, heroPlusCircle } from '@ng-icons/heroicons/outline';
import { heroFolderSolid } from '@ng-icons/heroicons/solid';
import { BucketsService } from './buckets.service';
import { Observable } from 'rxjs';
import { SearchbarComponent } from '../searchbar/searchbar.component';
import { BucketsTestObject } from '@ladon/tests/buckets-test-object';
import {BucketModel} from "../../api";

@Component({
  selector: 'buckets',
  standalone: true,
  imports: [CommonModule, NgIconComponent, SearchbarComponent],
  providers: [provideIcons({ heroFolder, heroPlusCircle, heroFolderSolid }), BucketsService, BucketsTestObject],
  templateUrl: './buckets.component.html',
  styleUrl: './buckets.component.scss',
})
export class BucketsComponent implements OnInit {
  dateFormat = 'dd.MM.yyyy';
  bucketsList$: Observable<BucketModel[]> | undefined;
  selectedBucket: BucketModel | undefined;
  bucketStats$: Observable<any> | undefined;

  private _bucketsList: BucketModel[] | undefined;

  constructor(public bucketsService: BucketsService) {}

  ngOnInit() {
    // TODO: Make this a real api call
    this.bucketsList$ = this.bucketsService.retrieveBucketsList();
    //	this.bucketStats$ = this.bucketsService.retrieveBucketStats();
    this._bucketsList = this.bucketsService.bucketsListBehaviorSubject.getValue();
  }

  selectBucket(bucket: BucketModel) {
    this.selectedBucket = bucket;
    this.bucketsService.selectedBucketSubject.next(bucket);
  }

  toggleFavorites(event: any) {
    const { target } = event;
    if (target.checked) {
      /*
			this.bucketsService.bucketsListBehaviorSubject.next(
				this._bucketsList?.filter((bucket: Bucket) => bucket.favourite === target.checked) as Bucket[]
			);

			 */
    } else {
      this.bucketsService.bucketsListBehaviorSubject.next(this._bucketsList);
    }
  }
}

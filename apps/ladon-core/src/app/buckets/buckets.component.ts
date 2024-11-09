import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import { heroFolder } from "@ng-icons/heroicons/outline";
import { BucketItem } from "../interfaces/bucket-item";
import { BucketsTestObject } from "../../../tests/buckets-test-object";
import { SearchbarComponent } from "@ladon/searchbar";

@Component({
	selector: "buckets",
	standalone: true,
	imports: [CommonModule, NgIconComponent, SearchbarComponent],
	providers: [provideIcons({ heroFolder }), BucketsTestObject],
	templateUrl: "./buckets.component.html",
	styleUrl: "./buckets.component.scss",
})
export class BucketsComponent implements OnInit {
	dateFormat = "dd.MM.yyyy";
	bucketsList: BucketItem[] | undefined;

	constructor(private bucketsTO: BucketsTestObject) {}

	ngOnInit() {
		// TODO: Make this a real api call
		this.bucketsList = this.bucketsTO.getBucketsMock();
	}
}

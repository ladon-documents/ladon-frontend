import { Component, EventEmitter, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { debounce, EMPTY, forkJoin, interval, of, mergeMap, tap } from "rxjs";
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import { heroMagnifyingGlass } from "@ng-icons/heroicons/outline";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { BucketsTestObject } from "apps/ladon-core/tests/buckets-test-object";
import { BucketItem } from "apps/ladon-core/src/app/interfaces/bucket-item";

type SearchTypes = "buckets" | "files" | "plugins" | "all";

@Component({
	selector: "lib-searchbar",
	standalone: true,
	providers: [provideIcons({ heroMagnifyingGlass }), BucketsTestObject],
	imports: [CommonModule, NgIconComponent, ReactiveFormsModule],
	templateUrl: "./searchbar.component.html",
})
export class SearchbarComponent {
	searchType = input<SearchTypes>("all");
	searchResult = output<any[]>();

	private readonly _debounceInterval = 750;
	search = new FormControl();

	constructor(private bucketsTO: BucketsTestObject) {}

	ngAfterViewInit() {
		this.search.valueChanges
			.pipe(
				debounce(() => interval(this._debounceInterval)),
				mergeMap((searchTerm: string) => {
					return forkJoin({
						searchTerm: of(searchTerm),
						searchTypePayload: this.fetchServicesAndJoin(),
					});
				})
			)
			.subscribe(({ searchTerm, searchTypePayload }) => {
				const { buckets, files, plugins } = searchTypePayload;
				this.searchResult.emit(buckets.filter((bucket: BucketItem) => bucket.id.includes(searchTerm)));
			});
	}

	private fetchServicesAndJoin() {
		return forkJoin({
			buckets: of(this.bucketsTO.getBucketsMock()),
			files: of(EMPTY),
			plugins: of(EMPTY),
		});
	}
}

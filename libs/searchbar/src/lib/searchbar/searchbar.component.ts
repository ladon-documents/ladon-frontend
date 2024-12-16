import { Component, EventEmitter, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { debounce, forkJoin, interval, of, mergeMap, Subject } from "rxjs";
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import { heroDocument, heroMagnifyingGlass, heroSquaresPlus, heroUser, heroXCircle } from "@ng-icons/heroicons/outline";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { BucketsTestObject } from "apps/ladon-core/tests/buckets-test-object";
import { SearchbarTestObject } from "libs/searchbar/tests/searchbar-test-objects";
import { SearchGroup } from "../../interfaces/search-group";

type SearchTypes = "buckets" | "files" | "plugins" | "users" | "permissions" | "roles";

@Component({
	selector: "lib-searchbar",
	standalone: true,
	providers: [
		provideIcons({ heroMagnifyingGlass, heroXCircle, heroSquaresPlus, heroUser, heroDocument }),
		BucketsTestObject,
		SearchbarTestObject,
	],
	imports: [CommonModule, NgIconComponent, ReactiveFormsModule],
	templateUrl: "./searchbar.component.html",
	styles: `
		dialog {
			width: min(80vw, 960px);
			height: min(85vh, 580px);

			&::backdrop {
				background: coral;
			}
		}
	`,
})
export class SearchbarComponent {
	searchType = input<SearchTypes>();
	searchResult = output<any[]>();

	private readonly _debounceInterval = 750;
	search = new FormControl();
	searchResult$ = new Subject<SearchGroup[]>();
	toggleDialog: boolean | undefined;

	constructor(private searchbarTO: SearchbarTestObject, private bucketsTO: BucketsTestObject) {}

	ngAfterViewInit() {
		this.search.valueChanges
			.pipe(
				debounce(() => interval(this._debounceInterval)),
				mergeMap((searchTerm: string) => {
					return forkJoin({
						searchTerm: of(searchTerm),
						searchPayload: this.fetchSearch(),
					});
				})
			)
			.subscribe(({ searchTerm, searchPayload }) => {
				const { data } = searchPayload;
				const filtered = data
					.filter((payload) => {
						if (this.searchType()) {
							return payload.groupType === this.searchType();
						}
						return payload;
					})
					.map(({ items, label, groupType }) => {
						return {
							label,
							groupType,
							items: items.filter((item) => item.key.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase())),
						};
					});
				// this.toggleDialog = true;
				this.searchResult$.next(filtered as SearchGroup[]);
				// this.searchResult.emit(buckets.filter((bucket: BucketItem) => bucket.id.includes(searchTerm)));
			});
	}

	private fetchSearch() {
		return of(this.searchbarTO.retrieveSearchGroupMock());
	}
}

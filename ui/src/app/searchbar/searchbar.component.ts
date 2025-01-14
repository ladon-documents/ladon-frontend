import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroMagnifyingGlass } from '@ng-icons/heroicons/outline';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounce, EMPTY, forkJoin, interval, mergeMap, of, Subject } from 'rxjs';
import { SearchGroup } from '../interfaces/search-group';

type SearchTypes = 'buckets' | 'files' | 'plugins' | 'users' | 'permissions' | 'roles';

@Component({
  selector: 'lib-searchbar',
  standalone: true,
  providers: [provideIcons({ heroMagnifyingGlass })],
  imports: [CommonModule, NgIconComponent, ReactiveFormsModule],
  templateUrl: './searchbar.component.html',
})
export class SearchbarComponent {
  searchType = input<SearchTypes>();
  searchResult = output<any[]>();

  private readonly _debounceInterval = 750;
  search = new FormControl();
  searchResult$ = new Subject<SearchGroup[]>();
  toggleDialog: boolean | undefined;

  constructor() // private searchbarTO: SearchbarTestObject,
  // private bucketsTO: BucketsTestObject
  {}

  ngAfterViewInit() {
    this.search.valueChanges
      .pipe(
        debounce(() => interval(this._debounceInterval)),
        mergeMap((searchTerm: string) => {
          return forkJoin({
            searchTerm: of(searchTerm),
            searchPayload: this.fetchSearch(),
          });
        }),
      )
      .subscribe(({ searchTerm, searchPayload }) => {
        // const { data } = searchPayload;
        // const filtered = data
        // 	.filter((payload: any) => {
        // 		if (this.searchType()) {
        // 			return payload.groupType === this.searchType();
        // 		}
        // 		return payload;
        // 	})
        // 	.map(({ items, label, groupType }: { items: any[], label: string, groupType: string }) => {
        // 		return {
        // 			label,
        // 			groupType,
        // 			items: items.filter((item) => item.key.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase())),
        // 		};
        // 	});
        this.searchResult$.next([] as SearchGroup[]);
        // this.searchResult.emit(bckets.filter((bucket: BucketItem) => bucket.id.includes(searchTerm)));
      });
  }

  private fetchSearch() {
    // return of(this.searchbarTO.retrieveSearchGroupMock());
    return of([]);
  }
}

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'searchfilter',
	standalone: true,
})
export class SearchfilterPipe implements PipeTransform {
	transform(items: any[], searchText: string): any[] {
		try {
			const search = searchText.toLocaleLowerCase();

			if (items instanceof Array) {
				return items.filter((item) => {
					return item['name'].toLowerCase().includes(search);
				});
			}

			return items;
		} catch (e) {
			return items;
		}
	}
}

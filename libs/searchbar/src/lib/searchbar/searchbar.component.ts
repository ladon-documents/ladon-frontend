import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import { heroMagnifyingGlass } from "@ng-icons/heroicons/outline";

@Component({
	selector: "lib-searchbar",
	standalone: true,
	providers: [provideIcons({ heroMagnifyingGlass })],
	imports: [CommonModule, NgIconComponent],
	templateUrl: "./searchbar.component.html",
})
export class SearchbarComponent {}

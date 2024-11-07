import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import { heroFolder } from "@ng-icons/heroicons/outline";

@Component({
	selector: "buckets",
	standalone: true,
	imports: [CommonModule, NgIconComponent],
	providers: [provideIcons({ heroFolder })],
	templateUrl: "./buckets.component.html",
	styleUrl: "./buckets.component.scss",
})
export class BucketsComponent {}

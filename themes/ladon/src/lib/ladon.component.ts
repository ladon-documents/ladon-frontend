import { Component, ViewEncapsulation } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
	selector: "lib-ladon",
	standalone: true,
	imports: [CommonModule],
	encapsulation: ViewEncapsulation.None,
	templateUrl: "./ladon.component.html",
	styleUrl: "./ladon.component.scss",
})
export class LadonComponent {}

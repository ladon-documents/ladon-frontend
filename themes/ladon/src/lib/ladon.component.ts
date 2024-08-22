import { Component, ViewEncapsulation } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
	selector: "lib-ladon",
	standalone: true,
	imports: [CommonModule],
	encapsulation: ViewEncapsulation.None,
	templateUrl: "./ladon.component.html",
	styleUrls: ["./ladon.component.scss", "../../node_modules/bootstrap/scss/bootstrap.scss"],
})
export class LadonComponent {}

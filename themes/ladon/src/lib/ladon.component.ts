import { Component, ViewEncapsulation } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CraftComponent } from "../../../craft/src";

@Component({
	selector: "lib-ladon",
	standalone: true,
	imports: [CommonModule, CraftComponent],
	encapsulation: ViewEncapsulation.None,
	template: `<lib-craft></lib-craft>`,
	styleUrls: ["./ladon.component.scss"],
})
export class LadonComponent {}

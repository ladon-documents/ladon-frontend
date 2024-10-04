import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
	selector: "lib-navigation",
	standalone: true,
	imports: [CommonModule],
	templateUrl: "./navigation.component.html",
	styles: `
    :host {
      display: block;
      height: 100%
    }
  `,
})
export class NavigationComponent {}

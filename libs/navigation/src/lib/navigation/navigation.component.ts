import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";

@Component({
	selector: "lib-navigation",
	standalone: true,
	imports: [CommonModule, RouterLink],
	templateUrl: "./navigation.component.html",
	styles: `
    :host {
      display: block;
      height: 100%
    }

    #logo {
      img {
        width: 120px
      }
    }
  `,
})
export class NavigationComponent {}

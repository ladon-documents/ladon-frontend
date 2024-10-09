import { Component, input, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NavigationEntry } from "../../interface/navigation-entry";

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

    #logo {
      img {
        width: 120px
      }
    }
  `,
})
export class NavigationComponent {
	navigation = input.required<NavigationEntry[]>();
	mainMenu = computed(() => this.navigation().filter(({ type }) => type === "main"));
	subMenu = computed(() => this.navigation().filter(({ type }) => type === "menu"));
}

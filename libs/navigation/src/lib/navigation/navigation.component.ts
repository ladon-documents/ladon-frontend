import { Component, input, output, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NavigationEntry } from "../../interface/navigation-entry";
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import {
	heroFolder,
	heroDocumentText,
	heroListBullet,
	heroArrowRightStartOnRectangle,
} from "@ng-icons/heroicons/outline";
import { Router } from "@angular/router";

@Component({
	selector: "lib-navigation",
	standalone: true,
	imports: [CommonModule, NgIconComponent],
	providers: [provideIcons({ heroFolder, heroDocumentText, heroListBullet, heroArrowRightStartOnRectangle })],
	templateUrl: "./navigation.component.html",
	styles: `
    :host {
      display: block;
      height: 100%
    }

    #logo {
      img {
        width: 100px
      }
    }

    ng-icon {
      --ng-icon__size: 1.5em !important;
    }
  `,
})
export class NavigationComponent {
	navigation = input.required<NavigationEntry[]>();
	mainMenu = computed(() => this.navigation().filter(({ type }) => type === "main"));
	subMenu = computed(() => this.navigation().filter(({ type }) => type === "menu"));
	navigationEntryAction = output<NavigationEntry>();

	constructor(private router: Router) {}

	invokeItem(item: NavigationEntry) {
		switch (item.target) {
			case "internal":
			case "remote":
				this.router.navigate([item.path]);
				break;
			case "action":
				this.navigationEntryAction.emit(item);
				break;
			case "external":
				window.open(item.path, "_blank");
				break;
		}
	}
}

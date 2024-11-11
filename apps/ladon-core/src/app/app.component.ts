import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { NavigationComponent } from "@ladon/navigation";
import { AsideComponent } from "./layout/aside/aside.component";
import {UsermanagerComponent} from "./usermanager/usermanager.component";
import {NavigationEntry} from "../../../../libs/navigation/src/interface/navigation-entry";
import {environment} from "@ladon/environment";

@Component({
	standalone: true,
	imports: [RouterModule, NavigationComponent, AsideComponent, UsermanagerComponent],
	selector: "ldn-mf-root",
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss",
})
export class AppComponent {
	public navigationEntries: Array<NavigationEntry> = [];
	title = "ladon-core";

	constructor() {
		this.navigationEntries = environment.navigation;

	}


}

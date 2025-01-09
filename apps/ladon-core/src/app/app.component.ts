import {Component, CUSTOM_ELEMENTS_SCHEMA} from "@angular/core";
import { RouterModule } from "@angular/router";
import { NavigationComponent } from "@ladon/navigation";
import { AsideComponent } from "./layout/aside/aside.component";
import { UsermanagerComponent } from "./usermanager/usermanager.component";
import { BucketsComponent } from "./buckets/buckets.component";
import { NavigationEntry } from "../../../../libs/navigation/src/interface/navigation-entry";
import { environment } from "@ladon/environment";
import {LoginComponent} from "@ladon/login";
import {AsyncPipe, CommonModule} from "@angular/common";
import {BehaviorSubject} from "rxjs";
import {AuthService} from "@ladon/auth-guard";

@Component({
	standalone: true,
	imports: [CommonModule, RouterModule, NavigationComponent, AsideComponent, UsermanagerComponent, BucketsComponent, LoginComponent, AsyncPipe],
	selector: "ldn-mf-root",
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss",
	schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent {
	public navigationEntries: Array<NavigationEntry> = [];
	isAuthenticated$ = this.as.user$;
	title = "ladon-core";

	constructor(private as: AuthService) {
		this.navigationEntries = environment.navigation;
	}
}


@Component({
	standalone: true,
	selector: 'app-empty-route',
	template: '',
})
export class EmptyRouteComponent {}

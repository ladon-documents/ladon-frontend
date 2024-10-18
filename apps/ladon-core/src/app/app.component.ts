import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { NavigationComponent } from "navigation";
import { AsideComponent } from "./layout/aside/aside.component";
import { UsermanagerComponent } from "./usermanager/usermanager.component";
import { BucketsComponent } from "./buckets/buckets.component";

@Component({
	standalone: true,
	imports: [RouterModule, NavigationComponent, AsideComponent, UsermanagerComponent, BucketsComponent],
	selector: "ldn-mf-root",
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss",
})
export class AppComponent {
	title = "ladon-core";
}

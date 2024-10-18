import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { NavigationComponent } from "navigation";
import { AsideComponent } from "./layout/aside/aside.component";

@Component({
	standalone: true,
	imports: [RouterModule, NavigationComponent, AsideComponent],
	selector: "ldn-mf-root",
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss",
})
export class AppComponent {
	title = "ladon-core";
}

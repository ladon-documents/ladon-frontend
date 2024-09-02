import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { LadonComponent } from "@mind/ladon-theme";

@Component({
	standalone: true,
	imports: [RouterModule, LadonComponent],
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss",
})
export class AppComponent {
	title = "core";
}

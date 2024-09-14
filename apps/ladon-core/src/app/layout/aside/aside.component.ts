import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import {RouterModule} from "@angular/router";

@Component({
	selector: "ldn-mf-aside",
	standalone: true,
	imports: [CommonModule,RouterModule],
	templateUrl: "./aside.component.html",
	styleUrl: "./aside.component.css",
})
export class AsideComponent {}

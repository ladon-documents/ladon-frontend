import {Component, Input} from "@angular/core";
import {CommonModule} from "@angular/common";
import {PdfviewerComponent} from "./pdfviewer.component";

@Component({
	standalone: true,
	imports: [
		PdfviewerComponent,
	],
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss",
})

export class AppComponent {
	pdfSrc!: string;
	@Input()
	set pdf(pdfSrc: string) {
		this.pdfSrc = pdfSrc;

	}
}


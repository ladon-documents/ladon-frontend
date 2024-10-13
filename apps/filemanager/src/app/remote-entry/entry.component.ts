import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DocmanagerComponent } from "../docmanager/docmanager.component";

@Component({
	standalone: true,
	imports: [CommonModule, DocmanagerComponent],
	selector: "ldn-mf-fm-filemanager-entry",
	template: `<ldn-mf-fm-docmanager></ldn-mf-fm-docmanager>`,
})
export class RemoteEntryComponent {}

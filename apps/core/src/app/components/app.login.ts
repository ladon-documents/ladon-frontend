import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterModule } from "@angular/router";

@Component({
	standalone: true,
	imports: [CommonModule, RouterModule, ReactiveFormsModule],
	selector: "app-login",
	templateUrl: "./app.login.html",
	styles: `
        :host {
            display: block;
            height: 100%
        }

        .flex-root {
            height: inherit
        }
    `,
})
export class AppLogin {
	title = "Willkommen bei Ladon";

	authenticateFormGroup = new FormGroup({
		email: new FormControl("", Validators.required),
		password: new FormControl("", Validators.required),
	});

	onSubmit() {
		console.log(this.authenticateFormGroup.value);
	}
}

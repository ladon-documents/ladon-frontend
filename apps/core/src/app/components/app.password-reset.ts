import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterModule } from "@angular/router";

@Component({
	standalone: true,
	imports: [CommonModule, RouterModule, ReactiveFormsModule],
	templateUrl: "./app.password-reset.html",
})
export class AppPasswordReset {
	title = "Willkommen bei Ladon";

	resetFormGroup = new FormGroup({
		email: new FormControl("", Validators.required),
	});

	onSubmit() {
		console.log(this.resetFormGroup.value);
	}
}

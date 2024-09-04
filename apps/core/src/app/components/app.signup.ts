import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterModule } from "@angular/router";

@Component({
	standalone: true,
	imports: [CommonModule, RouterModule, ReactiveFormsModule],
	selector: "app-signup",
	templateUrl: "./app.signup.html",
})
export class AppSignup {
	title = "Willkommen bei Ladon";

	signUpFormGroup = new FormGroup({
		firstName: new FormControl("", Validators.required),
		lastName: new FormControl("", Validators.required),
		email: new FormControl("", Validators.required),
		password: new FormControl("", Validators.required),
		confirmPassword: new FormControl("", Validators.required),
	});

	onSubmit() {
		console.log(this.signUpFormGroup.value);
	}
}

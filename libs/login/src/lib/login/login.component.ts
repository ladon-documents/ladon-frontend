import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
	selector: "lib-login",
	standalone: true,
	imports: [CommonModule],
	templateUrl: "./login.component.html",
	styleUrl: "./login.component.css",

})
export class LoginComponent {
	public config: { [key: string]: string } | undefined;

	public errorMessage: string | undefined;
	public loginAsset: string | undefined;
	public form: FormGroup;


	constructor(    private formBuilder: FormBuilder,
	) {
		this.form = this.formBuilder.group({
			username: ['', Validators.required],
			password: ['', Validators.required],
		});

	}

	ngOnInit(): void {

/*
		LadonAuthService.checkAuthProviders();
		this.readAppJson().then((config) => {
			this.config = config;
			this.retrieveLoginAsset(config);
		});

 */
	}

}

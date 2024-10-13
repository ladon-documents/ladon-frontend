import { Injectable } from "@angular/core";
import { AuthenticationService, LoginRequest, UsersService } from "ladon-api";
import { mergeMap } from "rxjs";

@Injectable({
	providedIn: "root",
})
export class AuthService {
	private readonly authConfig = {
		filter: "etc/ui/mind/mf-ladon-auth-api/config/auth.json",
		prefix: "etc/",
		bucket: "_system",
	};

	constructor(private as: AuthenticationService, private us: UsersService) {}

	public login(Login: LoginRequest) {
		return this.as.authenticateUser(Login).pipe(
			mergeMap((res) => {
				return this.us.getCurrentUser();
			})
		);
	}
}

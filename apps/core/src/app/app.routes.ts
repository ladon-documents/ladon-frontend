import { Route } from "@angular/router";
import { AppLogin } from "./components/app.login";
import { AppSignup } from "./components/app.signup";
import { AppPasswordReset } from "./components/app.password-reset";

export const appRoutes: Route[] = [
	{
		path: "login",
		component: AppLogin,
	},
	{
		path: "sign-up",
		component: AppSignup,
	},
	{
		path: "password-reset",
		component: AppPasswordReset,
	},
];

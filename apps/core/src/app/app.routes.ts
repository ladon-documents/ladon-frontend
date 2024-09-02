import { Route } from "@angular/router";
import { AppLogin } from "./components/app.login";
import { AppSignup } from "./components/app.signup";

export const appRoutes: Route[] = [
	{
		path: "login",
		component: AppLogin,
	},
	{
		path: "sign-up",
		component: AppSignup,
	},
];

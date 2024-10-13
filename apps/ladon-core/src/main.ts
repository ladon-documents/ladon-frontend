import { setRemoteDefinitions } from "@nx/angular/mf";
import { setNavigation } from "./app/app.navconfig";

const fetchNavigation = fetch("/assets/navigation.json");

fetchNavigation
	.then((res) => res.json())
	.then((nav) => setNavigation(nav))
	.then(() => {
		fetch("/assets/module-federation.manifest.json")
			.then((res) => res.json())
			.then((definitions) => setRemoteDefinitions(definitions))
			.then(() => import("./bootstrap").catch((err) => console.error(err)));
	});

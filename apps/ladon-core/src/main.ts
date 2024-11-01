import { setRemoteDefinitions } from "@nx/angular/mf";

const fetchNavigation = fetch("/assets/navigation.json");

export let navigationConfig: Array<any> = [];

fetchNavigation
	.then((res) => res.json())
	.then((nav) => (navigationConfig = nav))
	.then(() => {
		fetch("/assets/module-federation.manifest.json")
			.then((res) => res.json())
			.then((definitions) => setRemoteDefinitions(definitions))
			.then(() => import("./bootstrap").catch((err) => console.error(err)));
	});

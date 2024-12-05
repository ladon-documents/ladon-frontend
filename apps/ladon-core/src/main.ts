import { setRemoteDefinitions } from "@nx/angular/mf";
export const assetUrl = (url: string): string  => {
	// @ts-ignore
	const publicPath = __webpack_public_path__;
	const publicPathSuffix = publicPath.endsWith('/') ? '' : '/';
	const urlPrefix = url.startsWith('/') ? '' : '/';
	return `${publicPath}${publicPathSuffix}assets${urlPrefix}${url}`;
}

const fetchNavigation = fetch(assetUrl("/navigation.json"));

export let navigationConfig: Array<any> = [];

fetchNavigation
	.then((res) => res.json())
	.then((nav) => (navigationConfig = nav))
	.then(() => {
		fetch(assetUrl("/module-federation.manifest.json"))
			.then((res) => res.json())
			.then((definitions) => setRemoteDefinitions(definitions))
			.then(() => import("./bootstrap").catch((err) => console.error(err)));
	});

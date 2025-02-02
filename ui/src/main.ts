

const fetchNavigation = fetch("/ui/draco/ladon-core/public/navigation.json");

export let navigationConfig: Array<any> = [];

fetchNavigation
    .then((res) => res.json())
    .then((nav) => (navigationConfig = nav))
    .then(() => import("./bootstrap").catch((err) => console.error(err)));

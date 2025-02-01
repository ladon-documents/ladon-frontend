

export const assetUrl = (url: string): string => {
  // @ts-ignore
  const publicPath = location.pathname;
    const updatedPath = publicPath.replace("index.html", "");
  const publicPathSuffix = updatedPath.endsWith('/') ? '' : '/';
  const urlPrefix = url.startsWith('/') ? '' : '/';

  return `${updatedPath}${publicPathSuffix}assets${urlPrefix}${url}`;
}


const fetchNavigation = fetch("/ui/draco/ladon-core/public/navigation.json");

export let navigationConfig: Array<any> = [];

fetchNavigation
    .then((res) => res.json())
    .then((nav) => (navigationConfig = nav))
    .then(() => import("./bootstrap").catch((err) => console.error(err)));

const fetchNavigation = fetch('/ui/draco/ladon-core/public/navigation.json');
import { isDevMode } from '@angular/core';
import * as api from '@utility';
export let navigationConfig: Array<any> = [];

api.utility.Initalizer().initWebComponents();

if (isDevMode()) {

  let wcScriptElm = document.createElement("script");

  wcScriptElm.setAttribute("src", './public/wc-ladon-forms.js');
  wcScriptElm.setAttribute("type", "text/javascript");
  wcScriptElm.setAttribute("type", "module");

  document.body.appendChild(wcScriptElm);
}



fetchNavigation
  .then((res) => res.json())
  .then((nav) => (navigationConfig = nav))
  .then(() => setTailwindCDN())
  .then(() => import('./bootstrap').catch((err) => console.error(err)));

/**
 * Set the Tailwind CDN script in development mode
 * @returns {Promise<boolean>}
 */
async function setTailwindCDN(): Promise<boolean> {
  if (isDevMode()) {
    const tailwindCDN = document.createElement('script');
    tailwindCDN.src = 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4';
    document.head.appendChild(tailwindCDN);
    return true;
  }

  return false;
}

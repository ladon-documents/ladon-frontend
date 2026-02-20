import { webComponentLoader } from "./webcomponent-loader";

export const Initalizer = () => {
  const cssDeployPath = "/ui/draco/styles/global.css";
  const HEAD = "head";

  const createLinkElement = (href: string): HTMLLinkElement => {
    const link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = href;
    return link;
  };

  const createScriptElement = (src: string): HTMLScriptElement => {
    const script = document.createElement("script");
    script.src = src;
    script.type = "module";
    return script;
  };

  const initLadonStyles = () => {
    const cssLinkElement = createLinkElement(cssDeployPath);
    document.getElementsByTagName(HEAD)[0].appendChild(cssLinkElement);
  };

  const initWebComponents = async () => {
    return await webComponentLoader.initWebComponents();
  };

  return {
    initLadonStyles,
    initWebComponents,
  };
};

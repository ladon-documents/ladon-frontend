export const Initalizer = () => {
  const cssDeployPath = '/dist/ladon-global.css';
  const HEAD = 'head';

  const createLinkElement = (href: string): HTMLLinkElement => {
    const link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = href;
    return link;
  }


  const initLadonStyles = () => {
    const cssLinkElement = createLinkElement(cssDeployPath);
    document.getElementsByTagName(HEAD)[0].appendChild(cssLinkElement);
  }

  return {
    initLadonStyles
  };
}


import {DocumentsApi} from "../fetch-client";

export class WebcomponentLoader {

  private readonly webcomponentTerm = "*/draco/**/wc-*.js";
  private documentApi: DocumentsApi;

  constructor() {
    this.documentApi = new DocumentsApi( );
  }

  public async initWebComponents() {
    try {
      const result = await this.documentApi.findDocumentPath({
        bucket: "_ui",
        term: this.webcomponentTerm,
        limit: 100
      });

      if (result  && Array.isArray(result)) {
        for (const webcomponent of result) {
          this.injectWebComponent(webcomponent);
        }
        return true;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  private injectWebComponent(url: string) {
    url = url.replace("/_ui", "/ui");
    let wcScriptElm = document.createElement("script");

    wcScriptElm.setAttribute("src", url);
    wcScriptElm.setAttribute("type", "text/javascript");
    wcScriptElm.setAttribute("type", "module");

    document.body.appendChild(wcScriptElm);

  }
}

export const webComponentLoader = new WebcomponentLoader();

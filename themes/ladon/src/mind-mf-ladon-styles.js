import "./_barrel.scss";

import FileManagerWebfontWoff from "./assets/fonts/filemanager-webfont.woff";
import FileManagerWebfontWoff2 from "./assets/fonts/filemanager-webfont.woff2";
import WebixWebfontWoff from "./assets/fonts/webixmdi-webfont.woff";
import WebixWebfontWoff2 from "./assets/fonts/webixmdi-webfont.woff2";

import { LadonSpinner } from "./js/ladon-spinner";
import { LadonDialog } from "./js/ladon-dialog";
import { LadonContextMenu as ContextMenu } from "./js/ladon-context-menu";

const LadonContextMenu = new ContextMenu();

export { LadonSpinner, LadonDialog, LadonContextMenu };

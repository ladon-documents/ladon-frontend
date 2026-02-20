import { filesizePipeTransform, formatFileSize } from "./filesize.pipe";
import { aliasPipeTransform } from "./alias.pipe";
import { fileiconPipeTransform } from "./fileicon.pipe";
import { filenamePipeTransform } from "./filename.pipe";
import { Initalizer } from "./initalizer";

export { filesizePipeTransform, formatFileSize } from "./filesize.pipe";
export { aliasPipeTransform } from "./alias.pipe";
export { fileiconPipeTransform } from "./fileicon.pipe";
export { filenamePipeTransform } from "./filename.pipe";
export { Initalizer } from "./initalizer";

export const utility = {
  filesizePipeTransform,
  formatFileSize,
  aliasPipeTransform,
  fileiconPipeTransform,
  filenamePipeTransform,
  Initalizer,
};

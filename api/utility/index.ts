import { filesizePipeTransform, formatFileSize } from './filesize.pipe';
import { aliasPipeTransform } from './alias.pipe';
import { fileiconPipeTransform } from './fileicon.pipe';
import { filenamePipeTransform } from './filename.pipe';
import { Initalizer } from './initalizer';
import { buildTargetPath, encodePath, ensureFileExtension } from './path';
import { getFileExtension, isAudioDocument, isImageDocument, isPdfDocument } from './document-type';
import { isWebComponentRegistered } from './webcomponent';
export type {
  WebComponentLoaderOptions,
  WebComponentLocalConfig,
  WebComponentServerConfig,
  WebComponentSource,
} from './webcomponent-loader';

export {
  filesizePipeTransform,
  formatFileSize,
  aliasPipeTransform,
  fileiconPipeTransform,
  filenamePipeTransform,
  Initalizer,
  buildTargetPath,
  encodePath,
  ensureFileExtension,
  getFileExtension,
  isPdfDocument,
  isAudioDocument,
  isImageDocument,
  isWebComponentRegistered,
};

export const utility = {
  filesizePipeTransform,
  formatFileSize,
  aliasPipeTransform,
  fileiconPipeTransform,
  filenamePipeTransform,
  Initalizer,
  buildTargetPath,
  encodePath,
  ensureFileExtension,
  getFileExtension,
  isPdfDocument,
  isAudioDocument,
  isImageDocument,
  isWebComponentRegistered,
};

import { filesizePipeTransform, formatFileSize } from './filesize.pipe';
import { aliasPipeTransform } from './alias.pipe';
import { fileiconPipeTransform } from './fileicon.pipe';
import { filenamePipeTransform } from './filename.pipe';
import { Initalizer } from './initalizer';
import { auth } from './auth';
import { buildTargetPath, encodePath, ensureFileExtension } from './path';
import { getFileExtension, isAudioDocument, isImageDocument, isPdfDocument, isVideoDocument } from './document-type';
import { isWebComponentRegistered } from './webcomponent';
export type { AuthStorageLike, LadonAuthData, StaticAuthMiddlewareOptions, StaticAuthOptions } from './auth';
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
  auth,
  buildTargetPath,
  encodePath,
  ensureFileExtension,
  getFileExtension,
  isPdfDocument,
  isAudioDocument,
  isVideoDocument,
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
  auth,
  buildTargetPath,
  encodePath,
  ensureFileExtension,
  getFileExtension,
  isPdfDocument,
  isAudioDocument,
  isVideoDocument,
  isImageDocument,
  isWebComponentRegistered,
};

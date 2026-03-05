import { filesizePipeTransform, formatFileSize } from './filesize.pipe';
import { aliasPipeTransform } from './alias.pipe';
import { fileiconPipeTransform } from './fileicon.pipe';
import { filenamePipeTransform } from './filename.pipe';
import { Initalizer } from './initalizer';
import { buildTargetPath, encodePath, ensureFileExtension } from './path';
import { getFileExtension, isAudioDocument, isImageDocument, isPdfDocument } from './document-type';

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
};

export interface UtilityDocumentLike {
  'content-type'?: string;
  key?: string;
  path?: string;
  name?: string;
  isFolder?: boolean;
}

export const getFileExtension = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const lastPathElement = value.split('/').pop();
  if (!lastPathElement) {
    return null;
  }

  const dotIndex = lastPathElement.lastIndexOf('.');
  if (dotIndex === -1 || dotIndex === lastPathElement.length - 1) {
    return null;
  }

  return lastPathElement.slice(dotIndex + 1).toLowerCase();
};

const getDocumentExtension = (document?: UtilityDocumentLike | null): string | null => {
  if (!document) {
    return null;
  }

  return getFileExtension(document.key || document.path || document.name || '');
};

export const isPdfDocument = (document?: UtilityDocumentLike | null): boolean => {
  if (!document || document.isFolder) {
    return false;
  }

  const contentType = document['content-type']?.toLowerCase();
  if (contentType === 'application/pdf') {
    return true;
  }

  return getDocumentExtension(document) === 'pdf';
};

export const isAudioDocument = (
  document?: UtilityDocumentLike | null,
  supportedFormats: string[] = ['mp3', 'wav', 'ogg', 'm4a', 'aac'],
): boolean => {
  if (!document || document.isFolder) {
    return false;
  }

  const contentType = document['content-type']?.toLowerCase();
  if (contentType?.startsWith('audio/')) {
    return true;
  }

  const extension = getDocumentExtension(document);
  return !!extension && supportedFormats.includes(extension);
};

export const isVideoDocument = (
  document?: UtilityDocumentLike | null,
  supportedFormats: string[] = ['mp4', 'webm', 'mov', 'm4v', 'ogv', 'avi'],
): boolean => {
  if (!document || document.isFolder) {
    return false;
  }

  const contentType = document['content-type']?.toLowerCase();
  if (contentType?.startsWith('video/')) {
    return true;
  }

  const extension = getDocumentExtension(document);
  return !!extension && supportedFormats.includes(extension);
};

export const isImageDocument = (document?: UtilityDocumentLike | null): boolean => {
  if (!document || document.isFolder) {
    return false;
  }

  const contentType = document['content-type']?.toLowerCase();
  if (contentType?.startsWith('image/')) {
    return true;
  }

  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];
  const extension = getDocumentExtension(document);
  return !!extension && imageExtensions.includes(extension);
};

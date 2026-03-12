export const buildTargetPath = (basePath: string, documentKey: string): string => {
  if (basePath === '') {
    return documentKey;
  }

  return basePath.endsWith('/') ? `${basePath}${documentKey}` : `${basePath}/${documentKey}`;
};

export const encodePath = (path: string): string => {
  return path
    .split('/')
    .map((v: string) => encodeURIComponent(v))
    .join('/');
};

export const ensureFileExtension = (fileName: string, extension: string): string => {
  if (!extension) {
    return fileName;
  }

  const normalized = extension.startsWith('.') ? extension.slice(1) : extension;
  if (fileName.toLowerCase().endsWith(`.${normalized.toLowerCase()}`)) {
    return fileName;
  }

  return `${fileName}.${normalized}`;
};

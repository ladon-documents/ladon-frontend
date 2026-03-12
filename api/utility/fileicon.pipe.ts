import { getFileExtension } from './document-type';

export const fileiconPipeTransform = (payload: string): string => {
  const fileAssetPath = '/admin/api/filemanager/_system/icons/small/file';
  const typesAssetPath = '/ui/icons/small/types';

  if (payload) {
    const fileType = getFileExtension(payload);

    if (fileType) {
      return `${fileAssetPath}/${fileType}.svg`;
    }

    return `${typesAssetPath}/folder.svg`;
  }

  return `${fileAssetPath}/unknown.svg`;
};

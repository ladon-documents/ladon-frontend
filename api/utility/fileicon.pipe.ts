const extractFileType = (value: string): string | null => {
  const lastPathElement = value.split("/").pop();
  if (lastPathElement) {
    const dotIndex = lastPathElement.lastIndexOf(".");

    if (dotIndex === -1) {
      return null;
    }

    return lastPathElement.slice(dotIndex + 1);
  }
  return null;
};

export const fileiconPipeTransform = (payload: string): string => {
  const fileAssetPath = "/admin/api/filemanager/_system/icons/small/file";
  const typesAssetPath = "/ui/icons/small/types";

  if (payload) {
    const fileType = extractFileType(payload);

    if (fileType) {
      return `${fileAssetPath}/${extractFileType(payload)}.svg`;
    }

    // We need a folder icon
    return `${typesAssetPath}/folder.svg`;
  }

  return `${fileAssetPath}/unknown.svg`;
};

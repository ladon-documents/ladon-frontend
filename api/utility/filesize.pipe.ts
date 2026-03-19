export const filesizePipeTransform = (payload: any): string | null => {
  if (isNaN(payload)) {
    return null;
  }

  let count = 0;

  while (payload > 1024) {
    count++;
    payload = payload / 1024;
  }

  return (
    new Intl.NumberFormat("de-DE", { maximumSignificantDigits: 2 }).format(
      payload,
    ) + ` ${FileSizes[count]}`
  );
};

enum FileSizes {
  B,
  KB,
  MB,
  GB,
  TB,
  PB,
  EB,
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

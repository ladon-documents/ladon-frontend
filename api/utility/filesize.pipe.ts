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
    new Intl.NumberFormat("de-DE", { maximumSignificantDigits: 2 }).format(payload) +
    ` ${FileSizes[count]}`
  );
}

enum FileSizes {
  B,
  KB,
  MB,
  GB,
  TB,
  PB,
  EB,
}

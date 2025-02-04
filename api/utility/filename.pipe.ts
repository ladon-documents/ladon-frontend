export const filenamePipeTransform = (payload: string): string => {
  let lastSlashIndex = payload.lastIndexOf("/");
  const lastDotIndex = payload.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return payload.slice(0, lastSlashIndex);
  }

  lastSlashIndex += 1;
  return payload.slice(lastSlashIndex);
}

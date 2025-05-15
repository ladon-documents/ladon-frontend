import { DocumentModel } from '../../../api';

const storageKey = `mf-ladon-docmanager:view`;

export const findLastIndex = <T>(
  array: Array<T>,
  predicate: (value: T, index: number, obj: T[]) => boolean,
): number => {
  let l = array.length;
  while (l--) {
    if (predicate(array[l], l, array)) return l;
  }
  return -1;
};

export const getLastElemtentOfArray = (arr: Array<any>) => {
  if (arr && Array.isArray(arr) && arr.length > 0) {
    return arr[arr.length - 1];
  }
  return undefined;
};
export const encodeRFC5987ValueChars = (url: string) => {
  return (
    encodeURIComponent(url)
      // Note that although RFC3986 reserves "!", RFC5987 does not,
      // so we do not need to escape it
      .replace(/['()]/g, escape) // i.e., %27 %28 %29
      .replace(/\*/g, '%2A')
      // The following are not required for percent-encoding per RFC5987,
      // so we can allow for a little better readability over the wire: |`^
      .replace(/%(?:7C|60|5E)/g, unescape)
  );
};

export const encodePath = (path: string) => {
  return path
    .split('/')
    .map((v: string) => encodeURIComponent(v))
    .join('/');
};

export const getBucketNameFromUrlPath = () => {
  const query = location.search;
  const url = query.replace('?bucket=', '');
  let path = url.slice(url.indexOf('/') + 1);
  if (path.includes('&')) {
    path = path.slice(0, path.indexOf('&'));
  }
  return path;
};

export const formatTemplate = (size: number) => {
  if (size >= 1000000000) return (size / 1000000000).toFixed(1) + ' Gb';
  if (size >= 1000000) return (size / 1000000).toFixed(1) + ' Mb';
  if (size >= 1000) return (size / 1000).toFixed(1) + ' kb';

  return size + ' b';
};

export const isFolder = (document: DocumentModel) => {
  return document.path?.endsWith('/');
};

export const isFile = (document: DocumentModel) => {
  return !document.path?.endsWith('/');
};

export const dateSorter = (a: any, b: any) => {
  if (a.created < b.created) {
    return 1;
  }

  if (a.created > b.created) {
    return -1;
  }

  return 0;
};

export const returnFromStore = (t: string): string | null => {
  if (localStorage.getItem(storageKey)) {
    const storage = JSON.parse(localStorage.getItem(storageKey) as string);
    if (storage.hasOwnProperty(t)) {
      return storage[t];
    }
  }
  return null;
};

export const mergeAndStore = (t: string, v: any) => {
  const storage = JSON.parse(localStorage.getItem(storageKey) as string) || {};
  localStorage.setItem(storageKey, JSON.stringify(Object.assign(storage, { [t]: v })));
};

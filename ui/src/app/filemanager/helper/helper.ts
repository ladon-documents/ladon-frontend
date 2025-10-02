import { DocumentModel } from '../../../api';
import { PaginationState, SortConfig } from '../../store/filemanager.store';

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

const isEditableFile = (fileName?: string): boolean => {
  if (!fileName) return false;

  const editableExtensions = [
    'txt',
    'md',
    'js',
    'ts',
    'html',
    'css',
    'scss',
    'json',
    'xml',
    'py',
    'java',
    'c',
    'cpp',
    'cs',
    'php',
    'rb',
    'go',
    'rs',
    'sql',
    'yaml',
    'yml',
    'sh',
    'ps1',
    'dockerfile',
  ];

  const extension = fileName.split('.').pop()?.toLowerCase();
  return editableExtensions.includes(extension || '');
};

const calculatePaginationState = (
  allDocuments: DocumentModel[],
  currentPage: number,
  pageSize: number,
): {
  paginatedDocuments: DocumentModel[];
  paginationState: PaginationState;
} => {
  const totalItems = allDocuments.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedDocuments = allDocuments.slice(startIndex, endIndex);

  const paginationState: PaginationState = {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };

  return { paginatedDocuments, paginationState };
};

const filterDocuments = (documents: DocumentModel[], searchTerm: string): DocumentModel[] => {
  if (!searchTerm.trim()) {
    return documents;
  }

  const term = searchTerm.toLowerCase().trim();
  return documents.filter((doc) => doc.name?.toLowerCase().includes(term) || doc.key?.toLowerCase().includes(term));
};

const sortDocuments = (documents: DocumentModel[], sortConfig: SortConfig): DocumentModel[] => {
  return [...documents].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;

    switch (sortConfig.field) {
      case 'name':
        aValue = (a.name || '').toLowerCase();
        bValue = (b.name || '').toLowerCase();
        break;
      case 'size':
        aValue = a.size || 0;
        bValue = b.size || 0;
        break;
      case 'type':
        aValue = a.isFolder ? 'folder' : (a.key?.split('.').pop() || '').toLowerCase();
        bValue = b.isFolder ? 'folder' : (b.key?.split('.').pop() || '').toLowerCase();
        break;
      case 'last-modified':
        aValue = new Date(a['last-modified'] || 0).getTime();
        bValue = new Date(b['last-modified'] || 0).getTime();
        break;
      case 'created':
        aValue = new Date(a.created || 0).getTime();
        bValue = new Date(b.created || 0).getTime();
        break;
      default:
        aValue = a[sortConfig.field as keyof DocumentModel] || '';
        bValue = b[sortConfig.field as keyof DocumentModel] || '';
    }

    let comparison = 0;
    if (aValue < bValue) comparison = -1;
    if (aValue > bValue) comparison = 1;

    return sortConfig.direction === 'desc' ? -comparison : comparison;
  });
};

const applyFiltersAndPagination = (
  allDocuments: DocumentModel[],
  searchTerm: string,
  sortConfig: SortConfig,
  currentPage: number,
  pageSize: number,
) => {
  const filtered = filterDocuments(allDocuments, searchTerm);
  const sorted = sortDocuments(filtered, sortConfig);
  const { paginatedDocuments, paginationState } = calculatePaginationState(sorted, currentPage, pageSize);

  return {
    filteredDocuments: sorted,
    paginatedDocuments,
    paginationState,
  };
};

const isPdf = (document: DocumentModel | null): boolean => {
  return !!(
    document &&
    !document.isFolder &&
    (document['content-type'] === 'application/pdf' || document.path?.endsWith('.pdf'))
  );
};

export const filemanagerHelper = {
  isEditableFile,
  isPdf,
  filterDocuments,
  calculatePaginationState,
  sortDocuments,
  applyFiltersAndPagination,
};

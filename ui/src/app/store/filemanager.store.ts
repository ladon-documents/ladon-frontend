import { signalStore, withState } from '@ngrx/signals';

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

interface SortConfig {
  field: keyof Document;
  direction: 'asc' | 'desc';
}

interface Document {
  id: string;
  title: string;
  description?: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy: string;
  tags: string[];
  version: number;
  permissions: DocumentPermissions;
}

interface DocumentPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
}

interface FilterState {
  searchTerm: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  filters: {
    category: string[];
    status: string[];
    dateRange: { start: Date; end: Date };
  };
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
  };
}

interface NotificationState {
  notifications: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isRead: boolean;
    timestamp: Date;
  }>;
  unreadCount: number;
  isNotificationPanelOpen: boolean;
}

interface FilemanagerState {
  documents: Document[];
  selectedDocument: Document | null;
  isLoading: boolean;
  error: string | null;
  sort: SortConfig;
  pagination: PaginationState;
  searchTerm: string;
  selectedBucket: string | null;
}

const initialState: FilemanagerState = {
  documents: [],
  selectedDocument: null,
  selectedBucket: null,
  isLoading: false,
  error: null,
  sort: {
    field: 'updatedAt',
    direction: 'desc',
  },
  pagination: {
    currentPage: 1,
    pageSize: 20,
    totalItems: 0,
  },
  searchTerm: '',
};

export const FilemanagerStore = signalStore({ providedIn: 'root' }, withState(initialState));

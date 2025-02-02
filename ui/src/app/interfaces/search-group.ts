import { SearchEntry } from './search-entry';

export interface SearchGroup {
  label: string;
  groupType: string;
  items: SearchEntry[];
}

export type GroupType = 'buckets' | 'files' | 'plugins' | 'users' | 'permissions' | 'roles';

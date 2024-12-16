import { SearchItem } from "./search-item";

export interface SearchGroup {
	label: string;
	groupType: string;
	items: SearchItem[];
}

export type GroupType = "buckets" | "files" | "plugins" | "users" | "permissions" | "roles";

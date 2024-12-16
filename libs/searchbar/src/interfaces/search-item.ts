export interface SearchItem {
	contentType: string;
	created: string;
	createdBy: string;
	favourite: boolean;
	itemType: string;
	key: string;
	lastModified: string;
	path: string;
	size: number;
	version: number;
	id?: string;
	etag?: string;
	metadata?: object;
	owner?: string;
}

type ItemType = "folder" | "file" | "plugin" | "user";

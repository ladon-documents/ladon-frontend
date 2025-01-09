export interface BucketStats {
	size: number;
	versions: number;
	objects: number;
	name: string;
	lastModified: string;
	folderCount: number;
	fileCount: number;
}

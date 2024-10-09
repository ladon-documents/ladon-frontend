export type NavigationEntryTarget = "internal" | "external" | "static" | "action";
export type NavigationEntryType = "main" | "menu";

export interface NavigationEntry {
	label: string;
	id?: string;
	path?: string;
	target?: NavigationEntryTarget;
	icon?: string;
	type?: NavigationEntryType;
	index?: number;
}

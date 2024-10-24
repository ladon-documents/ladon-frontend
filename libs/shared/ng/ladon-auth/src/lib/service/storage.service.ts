export default abstract class Storage<T extends string> {
	private readonly storage: ILadonStorage;

	protected constructor(getStorage = (): ILadonStorage => window.sessionStorage) {
		this.storage = getStorage();
	}

	protected get(key: T): string | null {
		return this.storage.getItem(key);
	}

	protected set(key: T, value: string): void {
		this.storage.setItem(key, value);
	}

	protected clearItem(key: T): void {
		this.storage.removeItem(key);
	}

	protected clearItems(keys: T[]): void {
		keys.forEach((key) => this.clearItem(key));
	}
}

export interface ILadonStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
}

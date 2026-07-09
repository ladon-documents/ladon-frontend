import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';

import { FetchApiFactory } from '../services/api/fetch-api.factory';
import { DracoStaticConfigService, STATIC_ID_PATTERN } from './draco-static-config.service';
import { DracoStaticEntry, DracoStaticRegistrySnapshot } from './draco-static.types';
import { STATIC_SOURCE_CONFIG, StaticSourceConfig } from './static-source-config';

const DRACO_STATIC_BUCKET = 'draco-statics';
const DOCUMENT_LIST_LIMIT = 1000;
const MAX_DOCUMENT_LIST_PAGES = 100;
const CONFIG_SUFFIX = '/config.json';
const NAVIGATION_FILE = 'navigation.json';

interface DracoStaticDocument {
  key?: string;
}

type ListDocumentsResult = DracoStaticDocument[] & {
  last?: boolean;
  finalPage?: boolean;
  totalPages?: number;
  page?: {
    number?: number;
    totalPages?: number;
    last?: boolean;
  };
  metadata?: {
    page?: number;
    totalPages?: number;
    last?: boolean;
  };
};

@Injectable({ providedIn: 'root' })
export class DracoStaticRegistryService {
  private readonly snapshotSubject = new BehaviorSubject<DracoStaticRegistrySnapshot>(this.createSnapshot('idle', []));
  private discoveryPromise?: Promise<DracoStaticRegistrySnapshot>;

  readonly snapshot$: Observable<DracoStaticRegistrySnapshot> = this.snapshotSubject
    .asObservable()
    .pipe(map((snapshot) => this.cloneSnapshot(snapshot)));

  constructor(
    private readonly apiFactory: FetchApiFactory,
    private readonly configService: DracoStaticConfigService,
    @Inject(STATIC_SOURCE_CONFIG) private readonly sourceConfig: StaticSourceConfig,
  ) {}

  snapshot(): DracoStaticRegistrySnapshot {
    return this.cloneSnapshot(this.snapshotSubject.value);
  }

  discover(): Promise<DracoStaticRegistrySnapshot> {
    if (this.discoveryPromise) {
      return this.discoveryPromise;
    }

    if (this.snapshot().state === 'ready') {
      return Promise.resolve(this.snapshot());
    }

    this.discoveryPromise = this.discoverInternal().finally(() => {
      this.discoveryPromise = undefined;
    });

    return this.discoveryPromise;
  }

  waitUntilSettled(): Promise<DracoStaticRegistrySnapshot> {
    const current = this.snapshot();
    if (current.state === 'ready' || current.state === 'failed') {
      return Promise.resolve(current);
    }

    return this.discoveryPromise ?? this.discover();
  }

  getById(id: string): DracoStaticEntry | undefined {
    return this.snapshot().byId.get(id);
  }

  async lookupOnDemand(id: string): Promise<DracoStaticEntry | undefined> {
    if (!STATIC_ID_PATTERN.test(id)) {
      return undefined;
    }

    const existing = this.getById(id);
    if (existing) {
      return existing;
    }

    const entry = await this.loadEntry(id);
    if (!entry) {
      return undefined;
    }

    const current = this.snapshot();
    if (current.byId.has(entry.staticId)) {
      return current.byId.get(entry.staticId);
    }

    const nextEntries = [...current.entries, entry];
    const nextSnapshot = this.createSnapshot('ready', nextEntries);
    this.emitSnapshot(nextSnapshot);
    return entry;
  }

  private async discoverInternal(): Promise<DracoStaticRegistrySnapshot> {
    this.emitSnapshot(this.createSnapshot('loading', this.snapshotSubject.value.entries));

    try {
      const configFolders = await this.discoverConfigFolders();
      const entries: DracoStaticEntry[] = [];
      const byId = new Set<string>();

      for (const folderName of configFolders) {
        const entry = await this.loadEntry(folderName);
        if (!entry) {
          continue;
        }

        if (byId.has(entry.staticId)) {
          console.warn(`Skipping duplicate Draco static "${entry.staticId}".`);
          continue;
        }

        byId.add(entry.staticId);
        entries.push(entry);
      }

      const snapshot = this.createSnapshot('ready', this.mergeEntries(this.snapshotSubject.value.entries, entries));
      this.emitSnapshot(snapshot);
      return snapshot;
    } catch (error) {
      const snapshot = this.createSnapshot('failed', this.snapshotSubject.value.entries, this.errorMessage(error));
      this.emitSnapshot(snapshot);
      return snapshot;
    }
  }

  private async discoverConfigFolders(): Promise<string[]> {
    if (this.sourceConfig.source === 'local') {
      return this.discoverLocalConfigFolders();
    }

    const folders: string[] = [];
    const seenKeys = new Set<string>();
    let previousFullPageSignature: string | undefined;
    let page = 0;

    while (page < MAX_DOCUMENT_LIST_PAGES) {
      const documents = (await this.apiFactory.documentsApi.listDocuments({
        bucket: DRACO_STATIC_BUCKET,
        limit: DOCUMENT_LIST_LIMIT,
        page,
        currentFolder: false,
      })) as ListDocumentsResult;
      const fullPageSignature =
        documents.length === DOCUMENT_LIST_LIMIT ? this.documentPageSignature(documents) : undefined;

      for (const document of documents) {
        const folderName = this.folderNameFromConfigKey(document.key);
        if (!folderName || seenKeys.has(folderName)) {
          continue;
        }

        seenKeys.add(folderName);
        folders.push(folderName);
      }

      if (documents.length < DOCUMENT_LIST_LIMIT || this.isExplicitFinalPage(documents, page)) {
        return folders;
      }

      if (fullPageSignature && fullPageSignature === previousFullPageSignature) {
        console.warn(`Stopping Draco static discovery after page ${page} because the same full page repeated.`);
        return folders;
      }

      previousFullPageSignature = fullPageSignature;
      page += 1;
    }

    console.warn(`Stopping Draco static discovery after ${MAX_DOCUMENT_LIST_PAGES} full document pages.`);
    return folders;
  }

  private async discoverLocalConfigFolders(): Promise<string[]> {
    if (this.sourceConfig.source !== 'local') {
      return [];
    }

    const manifestPath = this.sourceConfig.local.manifestPath ?? `${this.localBasePath()}/static-pages.json`;
    const response = await fetch(manifestPath);
    if (!response.ok) {
      throw new Error(`Failed to load local Draco static manifest "${manifestPath}" (${response.status}).`);
    }

    const manifest = (await response.json()) as unknown;
    if (!Array.isArray(manifest)) {
      throw new Error('Local Draco static manifest must be an array of static ids.');
    }

    const folders: string[] = [];
    const seen = new Set<string>();
    for (const value of manifest) {
      if (typeof value !== 'string' || !STATIC_ID_PATTERN.test(value)) {
        console.warn(`Skipping invalid local Draco static id "${String(value)}".`);
        continue;
      }

      if (!seen.has(value)) {
        seen.add(value);
        folders.push(value);
      }
    }

    return folders;
  }

  private folderNameFromConfigKey(key: string | undefined): string | undefined {
    if (!key?.endsWith(CONFIG_SUFFIX)) {
      return undefined;
    }

    const folderName = key.slice(0, -CONFIG_SUFFIX.length);
    if (!folderName || folderName.includes('/') || !STATIC_ID_PATTERN.test(folderName)) {
      console.warn(`Skipping invalid Draco static config key "${key}".`);
      return undefined;
    }

    return folderName;
  }

  private async loadEntry(staticId: string): Promise<DracoStaticEntry | undefined> {
    if (!STATIC_ID_PATTERN.test(staticId)) {
      return undefined;
    }

    try {
      const config = await this.readJson(`${staticId}/config.json`);
      const entry = this.configService.parseConfig(staticId, config);
      const navigation = await this.loadNavigation(staticId);
      return navigation ? { ...entry, navigation } : entry;
    } catch (error) {
      console.warn(`Skipping invalid Draco static "${staticId}": ${this.errorMessage(error)}`);
      return undefined;
    }
  }

  private async loadNavigation(staticId: string): Promise<DracoStaticEntry['navigation']> {
    try {
      const navigation = await this.readJson(`${staticId}/${NAVIGATION_FILE}`);
      const parsedNavigation = this.configService.parseNavigation(staticId, navigation);
      if (!parsedNavigation) {
        console.warn(`Skipping invalid Draco static navigation for "${staticId}".`);
      }

      return parsedNavigation;
    } catch (error) {
      if (this.isOptionalNavigationMissing(error)) {
        return undefined;
      }

      console.warn(`Skipping invalid Draco static navigation for "${staticId}": ${this.errorMessage(error)}`);
      return undefined;
    }
  }

  private async readJson(key: string): Promise<unknown> {
    if (this.sourceConfig.source === 'local') {
      const response = await fetch(this.localUrlForKey(key));
      if (!response.ok) {
        throw { status: response.status, message: `Missing ${key}` };
      }

      return response.json();
    }

    const blob = await this.apiFactory.documentsApi.getDocument({
      bucket: DRACO_STATIC_BUCKET,
      key,
    });
    const text = await blob.text();
    return JSON.parse(text);
  }

  private createSnapshot(
    state: DracoStaticRegistrySnapshot['state'],
    entries: DracoStaticEntry[],
    error?: string,
  ): DracoStaticRegistrySnapshot {
    const snapshotEntries = Object.freeze([...entries]) as DracoStaticEntry[];
    const byId = new Map<string, DracoStaticEntry>();
    for (const entry of snapshotEntries) {
      if (!byId.has(entry.staticId)) {
        byId.set(entry.staticId, entry);
      }
    }

    return {
      state,
      entries: snapshotEntries,
      byId,
      ...(error ? { error } : {}),
    };
  }

  private cloneSnapshot(snapshot: DracoStaticRegistrySnapshot): DracoStaticRegistrySnapshot {
    return this.createSnapshot(snapshot.state, snapshot.entries, snapshot.error);
  }

  private emitSnapshot(snapshot: DracoStaticRegistrySnapshot): void {
    this.snapshotSubject.next(this.cloneSnapshot(snapshot));
  }

  private mergeEntries(primaryEntries: DracoStaticEntry[], secondaryEntries: DracoStaticEntry[]): DracoStaticEntry[] {
    const byId = new Map<string, DracoStaticEntry>();
    for (const entry of [...primaryEntries, ...secondaryEntries]) {
      if (!byId.has(entry.staticId)) {
        byId.set(entry.staticId, entry);
      }
    }

    return Array.from(byId.values());
  }

  private isExplicitFinalPage(documents: ListDocumentsResult, page: number): boolean {
    if (documents.last === true || documents.finalPage === true || documents.page?.last === true || documents.metadata?.last === true) {
      return true;
    }

    const totalPages = documents.totalPages ?? documents.page?.totalPages ?? documents.metadata?.totalPages;
    const currentPage = documents.page?.number ?? documents.metadata?.page ?? page;

    return typeof totalPages === 'number' && Number.isFinite(totalPages) && currentPage >= totalPages - 1;
  }

  private documentPageSignature(documents: ListDocumentsResult): string {
    return JSON.stringify(documents.map((document) => document.key ?? ''));
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private isOptionalNavigationMissing(error: unknown): boolean {
    if (typeof error === 'object' && error !== null && 'status' in error && error.status === 404) {
      return true;
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof error.response === 'object' &&
      error.response !== null &&
      'status' in error.response &&
      error.response.status === 404
    ) {
      return true;
    }

    return error instanceof Error && /^Missing .+\/navigation\.json$/.test(error.message);
  }

  private localUrlForKey(key: string): string {
    return `${this.localBasePath()}/${key
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/')}`;
  }

  private localBasePath(): string {
    return this.sourceConfig.source === 'local' ? this.sourceConfig.local.basePath.replace(/\/+$/, '') : '';
  }
}

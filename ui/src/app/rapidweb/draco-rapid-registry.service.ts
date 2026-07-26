import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';

import { FetchApiFactory } from '../services/api/fetch-api.factory';
import { DracoRapidConfigService, RAPID_ID_PATTERN } from './draco-rapid-config.service';
import { DracoRapidEntry, DracoRapidRegistrySnapshot } from './draco-rapid.types';
import { RAPID_SOURCE_CONFIG, RapidSourceConfig } from './rapid-source-config';

const DRACO_RAPID_BUCKET = 'draco-rapids';
const DOCUMENT_LIST_LIMIT = 1000;
const MAX_DOCUMENT_LIST_PAGES = 1;
const CONFIG_SUFFIX = '/config.json';
const NAVIGATION_FILE = 'navigation.json';

interface DracoRapidDocument {
  key?: string;
}

type ListDocumentsResult = DracoRapidDocument[] & {
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
export class DracoRapidRegistryService {
  private readonly snapshotSubject = new BehaviorSubject<DracoRapidRegistrySnapshot>(this.createSnapshot('idle', []));
  private discoveryPromise?: Promise<DracoRapidRegistrySnapshot>;

  readonly snapshot$: Observable<DracoRapidRegistrySnapshot> = this.snapshotSubject
    .asObservable()
    .pipe(map((snapshot) => this.cloneSnapshot(snapshot)));

  constructor(
    private readonly apiFactory: FetchApiFactory,
    private readonly configService: DracoRapidConfigService,
    @Inject(RAPID_SOURCE_CONFIG) private readonly sourceConfig: RapidSourceConfig,
  ) {}

  snapshot(): DracoRapidRegistrySnapshot {
    return this.cloneSnapshot(this.snapshotSubject.value);
  }

  discover(): Promise<DracoRapidRegistrySnapshot> {
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

  waitUntilSettled(): Promise<DracoRapidRegistrySnapshot> {
    const current = this.snapshot();
    if (current.state === 'ready' || current.state === 'failed') {
      return Promise.resolve(current);
    }

    return this.discoveryPromise ?? this.discover();
  }

  getById(id: string): DracoRapidEntry | undefined {
    return this.snapshot().byId.get(id);
  }

  async lookupOnDemand(id: string): Promise<DracoRapidEntry | undefined> {
    if (!RAPID_ID_PATTERN.test(id)) {
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
    if (current.byId.has(entry.rapidId)) {
      return current.byId.get(entry.rapidId);
    }

    const nextEntries = [...current.entries, entry];
    const nextSnapshot = this.createSnapshot('ready', nextEntries);
    this.emitSnapshot(nextSnapshot);
    return entry;
  }

  private async discoverInternal(): Promise<DracoRapidRegistrySnapshot> {
    this.emitSnapshot(this.createSnapshot('loading', this.snapshotSubject.value.entries));

    try {
      const configFolders = await this.discoverConfigFolders();
      const entries: DracoRapidEntry[] = [];
      const byId = new Set<string>();

      for (const folderName of configFolders) {
        const entry = await this.loadEntry(folderName);
        if (!entry) {
          continue;
        }

        if (byId.has(entry.rapidId)) {
          console.warn(`Skipping duplicate Draco rapid "${entry.rapidId}".`);
          continue;
        }

        byId.add(entry.rapidId);
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
    let page = 1;

    while (page <= MAX_DOCUMENT_LIST_PAGES) {
      const documents = (await this.apiFactory.documentsApi.listDocuments({
        bucket: DRACO_RAPID_BUCKET,
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
        console.warn(`Stopping Draco rapid discovery after page ${page} because the same full page repeated.`);
        return folders;
      }

      previousFullPageSignature = fullPageSignature;
      page += 1;
    }

    console.warn(`Stopping Draco rapid discovery after ${MAX_DOCUMENT_LIST_PAGES} full document pages.`);
    return folders;
  }

  private async discoverLocalConfigFolders(): Promise<string[]> {
    if (this.sourceConfig.source !== 'local') {
      return [];
    }

    const manifestPath = this.sourceConfig.local.manifestPath ?? `${this.localBasePath()}/rapid-pages.json`;
    const response = await fetch(manifestPath);
    if (!response.ok) {
      throw new Error(`Failed to load local Draco rapid manifest "${manifestPath}" (${response.status}).`);
    }

    const manifest = (await response.json()) as unknown;
    if (!Array.isArray(manifest)) {
      throw new Error('Local Draco rapid manifest must be an array of rapid ids.');
    }

    const folders: string[] = [];
    const seen = new Set<string>();
    for (const value of manifest) {
      if (typeof value !== 'string' || !RAPID_ID_PATTERN.test(value)) {
        console.warn(`Skipping invalid local Draco rapid id "${String(value)}".`);
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
    if (!folderName || folderName.includes('/') || !RAPID_ID_PATTERN.test(folderName)) {
      console.warn(`Skipping invalid Draco rapid config key "${key}".`);
      return undefined;
    }

    return folderName;
  }

  private async loadEntry(rapidId: string): Promise<DracoRapidEntry | undefined> {
    if (!RAPID_ID_PATTERN.test(rapidId)) {
      return undefined;
    }

    try {
      const config = await this.readJson(`${rapidId}/config.json`);
      const entry = this.configService.parseConfig(rapidId, config);
      const navigation = await this.loadNavigation(rapidId);
      return navigation ? { ...entry, navigation } : entry;
    } catch (error) {
      console.warn(`Skipping invalid Draco rapid "${rapidId}": ${this.errorMessage(error)}`);
      return undefined;
    }
  }

  private async loadNavigation(rapidId: string): Promise<DracoRapidEntry['navigation']> {
    try {
      const navigation = await this.readJson(`${rapidId}/${NAVIGATION_FILE}`);
      const parsedNavigation = this.configService.parseNavigation(rapidId, navigation);
      if (!parsedNavigation) {
        console.warn(`Skipping invalid Draco rapid navigation for "${rapidId}".`);
      }

      return parsedNavigation;
    } catch (error) {
      if (this.isOptionalNavigationMissing(error)) {
        return undefined;
      }

      console.warn(`Skipping invalid Draco rapid navigation for "${rapidId}": ${this.errorMessage(error)}`);
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
      bucket: DRACO_RAPID_BUCKET,
      key,
    });
    const text = await blob.text();
    return JSON.parse(text);
  }

  private createSnapshot(
    state: DracoRapidRegistrySnapshot['state'],
    entries: DracoRapidEntry[],
    error?: string,
  ): DracoRapidRegistrySnapshot {
    const snapshotEntries = Object.freeze([...entries]) as DracoRapidEntry[];
    const byId = new Map<string, DracoRapidEntry>();
    for (const entry of snapshotEntries) {
      if (!byId.has(entry.rapidId)) {
        byId.set(entry.rapidId, entry);
      }
    }

    return {
      state,
      entries: snapshotEntries,
      byId,
      ...(error ? { error } : {}),
    };
  }

  private cloneSnapshot(snapshot: DracoRapidRegistrySnapshot): DracoRapidRegistrySnapshot {
    return this.createSnapshot(snapshot.state, snapshot.entries, snapshot.error);
  }

  private emitSnapshot(snapshot: DracoRapidRegistrySnapshot): void {
    this.snapshotSubject.next(this.cloneSnapshot(snapshot));
  }

  private mergeEntries(primaryEntries: DracoRapidEntry[], secondaryEntries: DracoRapidEntry[]): DracoRapidEntry[] {
    const byId = new Map<string, DracoRapidEntry>();
    for (const entry of [...primaryEntries, ...secondaryEntries]) {
      if (!byId.has(entry.rapidId)) {
        byId.set(entry.rapidId, entry);
      }
    }

    return Array.from(byId.values());
  }

  private isExplicitFinalPage(documents: ListDocumentsResult, page: number): boolean {
    if (
      documents.last === true ||
      documents.finalPage === true ||
      documents.page?.last === true ||
      documents.metadata?.last === true
    ) {
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

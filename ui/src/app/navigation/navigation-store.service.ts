import { computed, Injectable, Signal, signal } from '@angular/core';

import { environment } from '../../environments/environment';
import { NavigationEntry } from '../interfaces/navigation-entry';

type NavigationOrigin = 'global' | 'static';

interface StoredNavigationEntry {
  entry: NavigationEntry;
  origin: NavigationOrigin;
  position: number;
  effectiveId?: string;
}

@Injectable({ providedIn: 'root' })
export class NavigationStore {
  private readonly globalNavigationEntries = signal<NavigationEntry[]>(this.cloneEntries(environment.navigation));
  private readonly staticNavigationEntries = signal<NavigationEntry[]>([]);

  readonly entries: Signal<NavigationEntry[]> = computed(() => {
    return [...this.storedGlobalEntries(), ...this.validStaticEntries()]
      .sort((a, b) => this.compareEntries(a, b))
      .map(({ entry }) => this.cloneEntry(entry));
  });

  setGlobal(entries: NavigationEntry[]): void {
    this.globalNavigationEntries.set(this.cloneEntries(entries));
  }

  setStatic(entries: NavigationEntry[]): void {
    this.staticNavigationEntries.set(this.cloneEntries(entries));
  }

  private validStaticEntries(): StoredNavigationEntry[] {
    const globalIds = new Set(
      this.globalNavigationEntries()
        .map((entry) => entry.id)
        .filter((id): id is string => !!id),
    );
    const staticIds = new Set<string>();
    const validEntries: StoredNavigationEntry[] = [];

    this.staticNavigationEntries().forEach((entry, position) => {
      if (entry.id && globalIds.has(entry.id)) {
        return;
      }

      const effectiveId = this.effectiveStaticId(entry);
      if (!effectiveId || globalIds.has(effectiveId) || staticIds.has(effectiveId)) {
        return;
      }

      staticIds.add(effectiveId);
      validEntries.push({ entry: { ...entry, id: effectiveId }, origin: 'static', position, effectiveId });
    });

    return validEntries;
  }

  private storedGlobalEntries(): StoredNavigationEntry[] {
    return this.globalNavigationEntries().map((entry, position) => ({
      entry,
      origin: 'global',
      position,
      effectiveId: entry.id,
    }));
  }

  private effectiveStaticId(entry: NavigationEntry): string | undefined {
    if (entry.target !== 'static' || typeof entry.path !== 'string' || entry.path.trim().length === 0) {
      return undefined;
    }

    const staticId = entry.id?.startsWith('static:') ? entry.id.slice('static:'.length) : entry.path;
    return staticId ? `static:${staticId}` : undefined;
  }

  private compareEntries(a: StoredNavigationEntry, b: StoredNavigationEntry): number {
    const indexComparison = this.navigationIndex(a.entry) - this.navigationIndex(b.entry);
    if (indexComparison !== 0) {
      return indexComparison;
    }

    if (a.origin !== b.origin) {
      return a.origin === 'global' ? -1 : 1;
    }

    if (a.origin === 'static') {
      const labelComparison = this.staticLabel(a).localeCompare(this.staticLabel(b));
      if (labelComparison !== 0) {
        return labelComparison;
      }

      const idComparison = (a.effectiveId ?? '').localeCompare(b.effectiveId ?? '');
      if (idComparison !== 0) {
        return idComparison;
      }
    }

    return a.position - b.position;
  }

  private navigationIndex(entry: NavigationEntry): number {
    return typeof entry.index === 'number' && Number.isFinite(entry.index) ? entry.index : Number.POSITIVE_INFINITY;
  }

  private staticLabel(entry: StoredNavigationEntry): string {
    return entry.entry.label.toLocaleLowerCase();
  }

  private cloneEntries(entries: NavigationEntry[]): NavigationEntry[] {
    return entries.map((entry) => this.cloneEntry(entry));
  }

  private cloneEntry(entry: NavigationEntry): NavigationEntry {
    return { ...entry };
  }
}

import { computed, Injectable, Signal, signal } from '@angular/core';

import { environment } from '../../environments/environment';
import { NavigationEntry } from '../interfaces/navigation-entry';

type NavigationOrigin = 'global' | 'rapid';

interface StoredNavigationEntry {
  entry: NavigationEntry;
  origin: NavigationOrigin;
  position: number;
  effectiveId?: string;
}

@Injectable({ providedIn: 'root' })
export class NavigationStore {
  private readonly globalNavigationEntries = signal<NavigationEntry[]>(this.cloneEntries(environment.navigation));
  private readonly rapidNavigationEntries = signal<NavigationEntry[]>([]);

  readonly entries: Signal<NavigationEntry[]> = computed(() => {
    return [...this.storedGlobalEntries(), ...this.validRapidEntries()]
      .sort((a, b) => this.compareEntries(a, b))
      .map(({ entry }) => this.cloneEntry(entry));
  });

  setGlobal(entries: NavigationEntry[]): void {
    this.globalNavigationEntries.set(this.cloneEntries(entries));
  }

  setRapid(entries: NavigationEntry[]): void {
    this.rapidNavigationEntries.set(this.cloneEntries(entries));
  }

  private validRapidEntries(): StoredNavigationEntry[] {
    const globalIds = new Set(
      this.globalNavigationEntries()
        .map((entry) => entry.id)
        .filter((id): id is string => !!id),
    );
    const rapidIds = new Set<string>();
    const validEntries: StoredNavigationEntry[] = [];

    this.rapidNavigationEntries().forEach((entry, position) => {
      if (entry.id && globalIds.has(entry.id)) {
        return;
      }

      const effectiveId = this.effectiveRapidId(entry);
      if (!effectiveId || globalIds.has(effectiveId) || rapidIds.has(effectiveId)) {
        return;
      }

      rapidIds.add(effectiveId);
      validEntries.push({ entry: { ...entry, id: effectiveId }, origin: 'rapid', position, effectiveId });
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

  private effectiveRapidId(entry: NavigationEntry): string | undefined {
    if (entry.target !== 'rapid' || typeof entry.path !== 'string' || entry.path.trim().length === 0) {
      return undefined;
    }

    const rapidId = entry.id?.startsWith('rapid:') ? entry.id.slice('rapid:'.length) : entry.path;
    return rapidId ? `rapid:${rapidId}` : undefined;
  }

  private compareEntries(a: StoredNavigationEntry, b: StoredNavigationEntry): number {
    const indexComparison = this.navigationIndex(a.entry) - this.navigationIndex(b.entry);
    if (indexComparison !== 0) {
      return indexComparison;
    }

    if (a.origin !== b.origin) {
      return a.origin === 'global' ? -1 : 1;
    }

    if (a.origin === 'rapid') {
      const labelComparison = this.rapidLabel(a).localeCompare(this.rapidLabel(b));
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

  private rapidLabel(entry: StoredNavigationEntry): string {
    return entry.entry.label.toLocaleLowerCase();
  }

  private cloneEntries(entries: NavigationEntry[]): NavigationEntry[] {
    return entries.map((entry) => this.cloneEntry(entry));
  }

  private cloneEntry(entry: NavigationEntry): NavigationEntry {
    return { ...entry };
  }
}

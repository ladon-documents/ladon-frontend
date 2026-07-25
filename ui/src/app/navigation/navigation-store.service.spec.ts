import { TestBed } from '@angular/core/testing';

import { NavigationEntry } from '../interfaces/navigation-entry';
import { NavigationStore } from './navigation-store.service';

describe('NavigationStore', () => {
  let store: NavigationStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(NavigationStore);
  });

  it('starts with global navigation', () => {
    const globalEntries = [entry('global:filemanager', 'Filemanager', 10), entry('global:tasks', 'Tasks', 20)];

    store.setGlobal(globalEntries);

    expect(store.entries()).toEqual(globalEntries);
  });

  it('does not expose later mutations to entries passed into the store', () => {
    const globalEntries = [entry('global:filemanager', 'Filemanager', 10)];
    const rapidEntries = [rapidEntry('rapid:reports', 'Reports', 20)];

    store.setGlobal(globalEntries);
    store.setRapid(rapidEntries);

    globalEntries[0].label = 'Mutated Global';
    rapidEntries[0].label = 'Mutated Rapid';

    expect(store.entries().map((entry) => entry.label)).toEqual(['Filemanager', 'Reports']);
  });

  it('appends rapid navigation sorted by index', () => {
    const globalEntries = [entry('global:filemanager', 'Filemanager', 10)];
    const rapidEntries = [rapidEntry('rapid:reports', 'Reports', 30), rapidEntry('rapid:alpha', 'Alpha', 20)];

    store.setGlobal(globalEntries);
    store.setRapid(rapidEntries);

    expect(ids()).toEqual(['global:filemanager', 'rapid:alpha', 'rapid:reports']);
  });

  it('keeps global entries before rapid entries for equal index', () => {
    store.setGlobal([entry('global:filemanager', 'Filemanager', 10)]);
    store.setRapid([rapidEntry('rapid:reports', 'Reports', 10)]);

    expect(ids()).toEqual(['global:filemanager', 'rapid:reports']);
  });

  it('ignores rapid navigation id duplicates when global id exists', () => {
    store.setGlobal([entry('rapid:reports', 'Global Reports', 10)]);
    store.setRapid([rapidEntry('rapid:reports', 'Rapid Reports', 20)]);

    expect(store.entries()).toEqual([entry('rapid:reports', 'Global Reports', 10)]);
  });

  it('ignores rapid navigation raw id duplicates when global id exists', () => {
    store.setGlobal([entry('global:filemanager', 'Filemanager', 10)]);
    store.setRapid([rapidEntry('global:filemanager', 'Reports', 20, 'reports')]);

    expect(store.entries()).toEqual([entry('global:filemanager', 'Filemanager', 10)]);
  });

  it('keeps the first rapid navigation entry when duplicate rapid ids exist', () => {
    store.setRapid([rapidEntry('rapid:reports', 'Reports', 20), rapidEntry('rapid:reports', 'Reports Duplicate', 10)]);

    expect(store.entries()).toEqual([rapidEntry('rapid:reports', 'Reports', 20)]);
  });

  it('sorts missing rapid indexes after indexed global entries', () => {
    store.setGlobal([entry('global:filemanager', 'Filemanager', 10)]);
    store.setRapid([rapidEntry('rapid:reports', 'Reports')]);

    expect(ids()).toEqual(['global:filemanager', 'rapid:reports']);
  });

  it('sorts rapid entries with same index alphabetically', () => {
    store.setRapid([
      rapidEntry('rapid:reports', 'Reports', 10),
      rapidEntry('rapid:alpha', 'Alpha', 10),
      rapidEntry('rapid:beta', 'Alpha', 10),
    ]);

    expect(ids()).toEqual(['rapid:alpha', 'rapid:beta', 'rapid:reports']);
  });

  function ids(): string[] {
    return store.entries().map((navigationEntry) => navigationEntry.id ?? '');
  }
});

function entry(id: string, label: string, index?: number): NavigationEntry {
  return {
    id,
    label,
    path: id,
    target: 'internal',
    type: 'main',
    ...(index === undefined ? {} : { index }),
  };
}

function rapidEntry(id: string, label: string, index?: number, path = id.replace(/^rapid:/, '')): NavigationEntry {
  return {
    id,
    label,
    path,
    target: 'rapid',
    type: 'main',
    ...(index === undefined ? {} : { index }),
  };
}

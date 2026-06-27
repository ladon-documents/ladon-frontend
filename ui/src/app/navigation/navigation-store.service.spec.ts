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
    const staticEntries = [staticEntry('static:reports', 'Reports', 20)];

    store.setGlobal(globalEntries);
    store.setStatic(staticEntries);

    globalEntries[0].label = 'Mutated Global';
    staticEntries[0].label = 'Mutated Static';

    expect(store.entries().map((entry) => entry.label)).toEqual(['Filemanager', 'Reports']);
  });

  it('appends static navigation sorted by index', () => {
    const globalEntries = [entry('global:filemanager', 'Filemanager', 10)];
    const staticEntries = [staticEntry('static:reports', 'Reports', 30), staticEntry('static:alpha', 'Alpha', 20)];

    store.setGlobal(globalEntries);
    store.setStatic(staticEntries);

    expect(ids()).toEqual(['global:filemanager', 'static:alpha', 'static:reports']);
  });

  it('keeps global entries before static entries for equal index', () => {
    store.setGlobal([entry('global:filemanager', 'Filemanager', 10)]);
    store.setStatic([staticEntry('static:reports', 'Reports', 10)]);

    expect(ids()).toEqual(['global:filemanager', 'static:reports']);
  });

  it('ignores static navigation id duplicates when global id exists', () => {
    store.setGlobal([entry('static:reports', 'Global Reports', 10)]);
    store.setStatic([staticEntry('static:reports', 'Static Reports', 20)]);

    expect(store.entries()).toEqual([entry('static:reports', 'Global Reports', 10)]);
  });

  it('ignores static navigation raw id duplicates when global id exists', () => {
    store.setGlobal([entry('global:filemanager', 'Filemanager', 10)]);
    store.setStatic([staticEntry('global:filemanager', 'Reports', 20, 'reports')]);

    expect(store.entries()).toEqual([entry('global:filemanager', 'Filemanager', 10)]);
  });

  it('keeps the first static navigation entry when duplicate static ids exist', () => {
    store.setStatic([
      staticEntry('static:reports', 'Reports', 20),
      staticEntry('static:reports', 'Reports Duplicate', 10),
    ]);

    expect(store.entries()).toEqual([staticEntry('static:reports', 'Reports', 20)]);
  });

  it('sorts missing static indexes after indexed global entries', () => {
    store.setGlobal([entry('global:filemanager', 'Filemanager', 10)]);
    store.setStatic([staticEntry('static:reports', 'Reports')]);

    expect(ids()).toEqual(['global:filemanager', 'static:reports']);
  });

  it('sorts static entries with same index alphabetically', () => {
    store.setStatic([
      staticEntry('static:reports', 'Reports', 10),
      staticEntry('static:alpha', 'Alpha', 10),
      staticEntry('static:beta', 'Alpha', 10),
    ]);

    expect(ids()).toEqual(['static:alpha', 'static:beta', 'static:reports']);
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

function staticEntry(id: string, label: string, index?: number, path = id.replace(/^static:/, '')): NavigationEntry {
  return {
    id,
    label,
    path,
    target: 'static',
    type: 'main',
    ...(index === undefined ? {} : { index }),
  };
}

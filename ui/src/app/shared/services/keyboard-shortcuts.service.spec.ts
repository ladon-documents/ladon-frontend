import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { Document } from '@ladon/api';

import { KeyboardShortcutsService } from './keyboard-shortcuts.service';
import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';
import { ClipboardStore } from '../../store/clipboard.store';
import { FilemanagerStore } from '../../store/filemanager.store';
import { SelectionStore } from '../../store/selection.store';
import { FilemanagerFacade } from '../../filemanager/filemanager.facade';
import { FilemanagerContextMenuService } from '../../filemanager/filemanager-context-menu.service';
import { LadonRouterService } from '../../services/ladon-router.service';
import { ToastService } from './toast.service';

const doc = (name: string): Document => ({ name, key: `/${name}`, bucket: '_ui', isFolder: false });

const press = (key: string, init: KeyboardEventInit = {}): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', { key, cancelable: true, ...init });
  document.dispatchEvent(event);
  return event;
};

describe('KeyboardShortcutsService', () => {
  let service: KeyboardShortcutsService;
  let router: Router;
  let selectionStore: jasmine.SpyObj<SelectionStore, 'selectedDocuments' | 'selectAll' | 'clearSelection'>;
  let filemanagerStore: jasmine.SpyObj<FilemanagerStore, 'documents' | 'selectedBucket' | 'deleteDocuments'>;
  let clipboardStore: jasmine.SpyObj<ClipboardStore, 'selectedDocuments' | 'addDocuments' | 'setLastAction' | 'lastAction'>;
  let facade: jasmine.SpyObj<FilemanagerFacade, 'moveDocuments' | 'copyDocuments'>;
  let contextMenu: jasmine.SpyObj<FilemanagerContextMenuService, 'rename'>;
  let toast: jasmine.SpyObj<ToastService, 'success' | 'error' | 'info' | 'warning'>;
  let ladonRouter: jasmine.SpyObj<LadonRouterService, 'filemanagerBaseRoute'>;

  beforeEach(() => {
    selectionStore = jasmine.createSpyObj('SelectionStore', ['selectedDocuments', 'selectAll', 'clearSelection']);
    filemanagerStore = jasmine.createSpyObj('FilemanagerStore', ['documents', 'selectedBucket', 'deleteDocuments']);
    clipboardStore = jasmine.createSpyObj('ClipboardStore', ['selectedDocuments', 'addDocuments', 'setLastAction', 'lastAction']);
    facade = jasmine.createSpyObj('FilemanagerFacade', ['moveDocuments', 'copyDocuments']);
    contextMenu = jasmine.createSpyObj('FilemanagerContextMenuService', ['rename']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error', 'info', 'warning']);
    ladonRouter = jasmine.createSpyObj('LadonRouterService', ['filemanagerBaseRoute']);

    // Sinnvolle Defaults (inert) — Tests überschreiben gezielt.
    selectionStore.selectedDocuments.and.returnValue([]);
    filemanagerStore.documents.and.returnValue([]);
    filemanagerStore.selectedBucket.and.returnValue('_ui');
    clipboardStore.selectedDocuments.and.returnValue([]);
    clipboardStore.lastAction.and.returnValue('copy');
    ladonRouter.filemanagerBaseRoute.and.returnValue('/filemanager/');

    TestBed.configureTestingModule({
      imports: smokeTestImports,
      providers: [
        ...smokeTestProviders(),
        { provide: SelectionStore, useValue: selectionStore },
        { provide: FilemanagerStore, useValue: filemanagerStore },
        { provide: ClipboardStore, useValue: clipboardStore },
        { provide: FilemanagerFacade, useValue: facade },
        { provide: FilemanagerContextMenuService, useValue: contextMenu },
        { provide: LadonRouterService, useValue: ladonRouter },
        { provide: ToastService, useValue: toast },
      ],
    });

    service = TestBed.inject(KeyboardShortcutsService);
    router = TestBed.inject(Router);
  });

  afterAll(() => {
    // Globalen keydown-Listener wieder loswerden (keine Seiteneffekte in späteren Specs).
    service.dispose();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('native key passthrough (B9/F24)', () => {
    it('does not block native Ctrl+A when no file-manager context is active', () => {
      service.init();

      const event = press('a', { ctrlKey: true });

      expect(event.defaultPrevented).toBe(false);
      expect(selectionStore.selectAll).not.toHaveBeenCalled();
    });

    it('does not block Delete or Escape when the file-manager context is not active', () => {
      service.init();

      const deleteEvent = press('Delete');
      const escapeEvent = press('Escape');

      expect(deleteEvent.defaultPrevented).toBe(false);
      expect(escapeEvent.defaultPrevented).toBe(false);
      expect(selectionStore.clearSelection).not.toHaveBeenCalled();
    });

    it('lets the key pass to the browser even when enabled, outside the file manager', async () => {
      const escape = service.getShortcuts().find((shortcut) => shortcut.key === 'Escape');
      if (!escape) {
        throw new Error('Escape shortcut missing');
      }
      escape.enabled = true;
      selectionStore.selectedDocuments.and.returnValue([doc('a.txt')]);
      service.init();
      await router.navigateByUrl('/buckets'); // außerhalb /filemanager/

      const event = press('Escape');

      expect(selectionStore.clearSelection).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('file-manager actions (F24 / WP-FM.7a)', () => {
    const filemanagerUrl = '/filemanager/_ui';

    it('blocks the key only when the shortcut is enabled and the context allows it', async () => {
      const escape = service.getShortcuts().find((shortcut) => shortcut.key === 'Escape');
      if (!escape) {
        throw new Error('Escape shortcut missing');
      }
      escape.enabled = true;
      selectionStore.selectedDocuments.and.returnValue([doc('a.txt')]);
      service.init();
      await router.navigateByUrl(filemanagerUrl);

      const event = press('Escape');

      expect(selectionStore.clearSelection).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('Ctrl+A selects all currently visible documents', async () => {
      const docs = [doc('a.txt'), doc('b.pdf')];
      filemanagerStore.documents.and.returnValue(docs);
      service.init();
      await router.navigateByUrl(filemanagerUrl);

      const event = press('a', { ctrlKey: true });

      expect(selectionStore.selectAll).toHaveBeenCalledTimes(1);
      expect(selectionStore.selectAll).toHaveBeenCalledWith(docs);
      expect(event.defaultPrevented).toBe(true);
    });

    it('Ctrl+C copies the selection into the clipboard', async () => {
      const selected = [doc('a.txt'), doc('b.pdf')];
      selectionStore.selectedDocuments.and.returnValue(selected);
      service.init();
      await router.navigateByUrl(filemanagerUrl);

      const event = press('c', { ctrlKey: true });

      expect(clipboardStore.addDocuments).toHaveBeenCalledTimes(1);
      expect(clipboardStore.addDocuments).toHaveBeenCalledWith(selected);
      expect(toast.success).toHaveBeenCalledWith('2 Element(e) kopiert');
      expect(event.defaultPrevented).toBe(true);
    });

    it('Ctrl+C without a selection gives feedback and does not swallow the key', async () => {
      service.init();
      await router.navigateByUrl(filemanagerUrl);

      const event = press('c', { ctrlKey: true });

      expect(clipboardStore.addDocuments).not.toHaveBeenCalled();
      expect(toast.info).toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });

    it('Ctrl+X cuts the selection (clipboard + move-action) and clears the selection', async () => {
      const selected = [doc('a.txt')];
      selectionStore.selectedDocuments.and.returnValue(selected);
      service.init();
      await router.navigateByUrl(filemanagerUrl);

      const event = press('x', { ctrlKey: true });

      expect(clipboardStore.addDocuments).toHaveBeenCalledTimes(1);
      expect(clipboardStore.addDocuments).toHaveBeenCalledWith(selected);
      expect(clipboardStore.setLastAction).toHaveBeenCalledWith('move');
      expect(selectionStore.clearSelection).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('Ctrl+V pastes a copied clipboard into the current folder (copy)', async () => {
      const clipboardDocs = [doc('a.txt')];
      clipboardStore.selectedDocuments.and.returnValue(clipboardDocs);
      clipboardStore.lastAction.and.returnValue('copy');
      service.init();
      await router.navigateByUrl(filemanagerUrl);

      const event = press('v', { ctrlKey: true });

      expect(facade.copyDocuments).toHaveBeenCalledTimes(1);
      expect(facade.copyDocuments).toHaveBeenCalledWith(clipboardDocs);
      expect(facade.moveDocuments).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(true);
    });

    it('Ctrl+V pastes a cut clipboard as move', async () => {
      const clipboardDocs = [doc('a.txt'), doc('b.pdf')];
      clipboardStore.selectedDocuments.and.returnValue(clipboardDocs);
      clipboardStore.lastAction.and.returnValue('move');
      service.init();
      await router.navigateByUrl(filemanagerUrl);

      const event = press('v', { ctrlKey: true });

      expect(facade.moveDocuments).toHaveBeenCalledTimes(1);
      expect(facade.moveDocuments).toHaveBeenCalledWith(clipboardDocs);
      expect(facade.copyDocuments).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(true);
    });

    it('Ctrl+V with an empty clipboard does not swallow the key', async () => {
      service.init();
      await router.navigateByUrl(filemanagerUrl);

      const event = press('v', { ctrlKey: true });

      expect(facade.copyDocuments).not.toHaveBeenCalled();
      expect(facade.moveDocuments).not.toHaveBeenCalled();
      expect(toast.info).toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });

    it('Delete removes the selection via the store (store owns confirm/toast/reload)', async () => {
      const selected = [doc('a.txt'), doc('b.pdf')];
      selectionStore.selectedDocuments.and.returnValue(selected);
      service.init();
      await router.navigateByUrl(filemanagerUrl);

      const event = press('Delete');

      expect(filemanagerStore.deleteDocuments).toHaveBeenCalledTimes(1);
      expect(filemanagerStore.deleteDocuments).toHaveBeenCalledWith(selected);
      expect(event.defaultPrevented).toBe(true);
    });

    it('Delete without a selection does not swallow the key', async () => {
      service.init();
      await router.navigateByUrl(filemanagerUrl);

      const event = press('Delete');

      expect(filemanagerStore.deleteDocuments).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });

    it('F2 renames exactly one selected document via the context-menu flow (O3)', async () => {
      const target = doc('a.txt');
      selectionStore.selectedDocuments.and.returnValue([target]);
      service.init();
      await router.navigateByUrl(filemanagerUrl);

      const event = press('F2');

      expect(contextMenu.rename).toHaveBeenCalledTimes(1);
      expect(contextMenu.rename).toHaveBeenCalledWith(target);
      expect(event.defaultPrevented).toBe(true);
    });

    it('F2 does nothing (and does not swallow the key) for 0 or 2 selected documents', async () => {
      service.init();
      await router.navigateByUrl(filemanagerUrl);

      const zeroSelection = press('F2');
      expect(contextMenu.rename).not.toHaveBeenCalled();
      expect(zeroSelection.defaultPrevented).toBe(false);

      selectionStore.selectedDocuments.and.returnValue([doc('a.txt'), doc('b.pdf')]);
      const twoSelection = press('F2');
      expect(contextMenu.rename).not.toHaveBeenCalled();
      expect(twoSelection.defaultPrevented).toBe(false);
    });

    it('Space (quick preview) stays passive (deaktiviert, WP-FM.7a-Rest offen)', async () => {
      selectionStore.selectedDocuments.and.returnValue([doc('a.png')]);
      service.init();
      await router.navigateByUrl(filemanagerUrl);

      const event = press(' ');

      expect(event.defaultPrevented).toBe(false);
    });
  });
});

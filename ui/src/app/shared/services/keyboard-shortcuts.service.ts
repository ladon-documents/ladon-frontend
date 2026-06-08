// ui/src/app/shared/services/keyboard-shortcuts.service.ts
import { Injectable, inject } from '@angular/core';
import { FilemanagerFacade } from '../../filemanager/filemanager.facade';
import { ClipboardStore } from '../../store/clipboard.store';
import { Document } from '@ladon/api';

export interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class KeyboardShortcutsService {
  private readonly filemanagerFacade = inject(FilemanagerFacade);
  private readonly clipboardStore = inject(ClipboardStore);
  private shortcuts: ShortcutHandler[] = [];

  init() {
    this.registerDefaultShortcuts();
    this.attachEventListener();
  }

  private registerDefaultShortcuts() {
    this.shortcuts = [
      {
        key: 'a',
        ctrl: true,
        handler: () => this.selectAll(),
        description: 'Alle auswählen',
      },
      {
        key: 'c',
        ctrl: true,
        handler: () => this.copy(),
        description: 'Kopieren',
      },
      {
        key: 'x',
        ctrl: true,
        handler: () => this.cut(),
        description: 'Ausschneiden',
      },
      {
        key: 'v',
        ctrl: true,
        handler: () => this.paste(),
        description: 'Einfügen',
      },
      {
        key: 'Delete',
        handler: () => this.delete(),
        description: 'Löschen',
      },
      {
        key: 'F2',
        handler: () => this.rename(),
        description: 'Umbenennen',
      },
      {
        key: ' ',
        handler: () => this.quickPreview(),
        description: 'Schnellvorschau',
      },
      {
        key: 'Escape',
        handler: () => this.deselectAll(),
        description: 'Auswahl aufheben',
      },
    ];
  }

  private attachEventListener() {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      // Ignore shortcuts in input fields
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const shortcut = this.shortcuts.find((s) => {
        const ctrlMatch = s.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = s.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = s.alt ? event.altKey : !event.altKey;
        const keyMatch = s.key === event.key;

        return ctrlMatch && shiftMatch && altMatch && keyMatch;
      });

      if (shortcut) {
        event.preventDefault();
        shortcut.handler();
      }
    });
  }

  private selectAll() {
    // TODO: Implement select all logic
    console.log('Select all');
  }

  private copy() {
    // TODO: Implement copy logic
    console.log('Copy');
  }

  private cut() {
    // TODO: Implement cut logic
    console.log('Cut');
  }

  private paste() {
    // TODO: Implement paste logic
    console.log('Paste');
  }

  private delete() {
    // TODO: Implement delete logic
    console.log('Delete');
  }

  private rename() {
    // TODO: Implement rename logic
    console.log('Rename');
  }

  private quickPreview() {
    // TODO: Implement quick preview
    console.log('Quick preview');
  }

  private deselectAll() {
    // TODO: Implement deselect all
    console.log('Deselect all');
  }

  getShortcuts(): ShortcutHandler[] {
    return this.shortcuts;
  }
}

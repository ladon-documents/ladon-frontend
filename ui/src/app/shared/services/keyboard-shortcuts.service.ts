// ui/src/app/shared/services/keyboard-shortcuts.service.ts
import { devLog } from '../util/dev-log';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FilemanagerFacade } from '../../filemanager/filemanager.facade';
import { FilemanagerContextMenuService } from '../../filemanager/filemanager-context-menu.service';
import { LadonRouterService } from '../../services/ladon-router.service';
import { ClipboardStore } from '../../store/clipboard.store';
import { FilemanagerStore } from '../../store/filemanager.store';
import { SelectionStore } from '../../store/selection.store';
import { ToastService } from './toast.service';

export interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  /**
   * Wird nur bei aktiven (implementierten) Shortcuts aufgerufen. Rückgabe `true`
   * heißt: die Taste wurde vom Shortcut bedient → natives Verhalten wird via
   * `preventDefault` unterdrückt. Rückgabe `undefined` heißt: die Aktion war im
   * aktuellen Kontext nicht ausführbar (außerhalb des Filemanagers, keine
   * Auswahl, leere Zwischenablage) → die Taste bleibt dem Browser erhalten —
   * natives Kopieren/Auswählen/Löschen funktioniert weiter (B9/F24).
   */
  handler: () => boolean | void;
  description: string;
  /**
   * Ob der Shortcut implementiert und aktiv ist. Deaktivierte Shortcuts
   * (z. B. der „Schnellvorschau"-Platzhalter) greifen keinerlei ein.
   */
  enabled?: boolean;
}

/**
 * Genau ein globaler keydown-Listener, immer an die zuletzt initialisierte
 * Instanz angehängt (idempotent, kein Anhäufen über Init/Test-Läufe hinweg).
 */
let globalKeydownListener: ((event: KeyboardEvent) => void) | null = null;
let activeKeyboardShortcuts: KeyboardShortcutsService | null = null;

function onGlobalKeydown(event: KeyboardEvent): void {
  activeKeyboardShortcuts?.handleKeydown(event);
}

function attachGlobalKeydownListener(): void {
  if (globalKeydownListener) {
    document.removeEventListener('keydown', globalKeydownListener);
  }
  document.addEventListener('keydown', onGlobalKeydown);
  globalKeydownListener = onGlobalKeydown;
}

@Injectable({
  providedIn: 'root',
})
export class KeyboardShortcutsService {
  private readonly filemanagerFacade = inject(FilemanagerFacade);
  private readonly filemanagerStore = inject(FilemanagerStore);
  private readonly selectionStore = inject(SelectionStore);
  private readonly clipboardStore = inject(ClipboardStore);
  private readonly contextMenuService = inject(FilemanagerContextMenuService);
  private readonly toastService = inject(ToastService);
  private readonly ladonRouter = inject(LadonRouterService);
  private readonly router = inject(Router);
  private shortcuts: ShortcutHandler[] = [];

  init() {
    this.registerDefaultShortcuts();
    attachGlobalKeydownListener();
    activeKeyboardShortcuts = this;
  }

  /** Detachiert den globalen Listener (Cleanup, z. B. nach Testläufen). */
  dispose(): void {
    if (activeKeyboardShortcuts !== this) {
      return;
    }
    activeKeyboardShortcuts = null;
    if (globalKeydownListener) {
      document.removeEventListener('keydown', globalKeydownListener);
      globalKeydownListener = null;
    }
  }

  private registerDefaultShortcuts() {
    this.shortcuts = [
      {
        key: 'a',
        ctrl: true,
        handler: () => this.selectAll(),
        description: 'Alle auswählen',
        enabled: true,
      },
      {
        key: 'c',
        ctrl: true,
        handler: () => this.copy(),
        description: 'Kopieren',
        enabled: true,
      },
      {
        key: 'x',
        ctrl: true,
        handler: () => this.cut(),
        description: 'Ausschneiden',
        enabled: true,
      },
      {
        key: 'v',
        ctrl: true,
        handler: () => this.paste(),
        description: 'Einfügen',
        enabled: true,
      },
      {
        key: 'Delete',
        handler: () => this.delete(),
        description: 'Löschen',
        enabled: true,
      },
      {
        key: 'F2',
        handler: () => this.rename(),
        description: 'Umbenennen',
        enabled: true,
      },
      {
        key: ' ',
        handler: () => {
          // TODO (WP-FM.7a Rest): „Schnellvorschau" per Typ (PDF/Bild/Medien/Editor) —
          // benötigt dieselbe WC-Kontext-Logik wie `openDocumentByType` (Double-Click);
          // bewusst noch deaktiviert statt zu raten.
          devLog('Quick preview');
        },
        description: 'Schnellvorschau',
        enabled: false,
      },
      {
        key: 'Escape',
        handler: () => this.deselectAll(),
        description: 'Auswahl aufheben',
        enabled: true,
      },
    ];
  }

  handleKeydown(event: KeyboardEvent) {
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

    // Nur aktive Shortcuts laufen; der Handler entscheidet, ob die Aktion im
    // aktuellen Kontext tatsächlich ausführbar ist. Nur dann wird die native
    // Tasten-Aktion unterdrückt — sonst bleibt sie dem Browser erhalten (B9/F24).
    if (shortcut && shortcut.enabled === true) {
      if (shortcut.handler() === true) {
        event.preventDefault();
      }
    }
  }

  /** Nur innerhalb der Filemanager-Routen (Backend-Navigation + Bucket) aktiv. */
  private isInFilemanager(): boolean {
    const baseRoute = this.ladonRouter.filemanagerBaseRoute();
    if (!baseRoute) {
      return false;
    }
    const url = this.router.url;
    return url === baseRoute || url.startsWith(baseRoute);
  }

  private selectAll(): boolean | void {
    if (!this.isInFilemanager()) {
      return;
    }

    const documents = this.filemanagerStore.documents();
    if (documents.length === 0) {
      this.toastService.info('Keine Elemente zum Auswählen vorhanden');
      return;
    }

    this.selectionStore.selectAll(documents);
    devLog('Select all:', documents.length);
    return true;
  }

  private copy(): boolean | void {
    if (!this.isInFilemanager()) {
      return;
    }

    const selected = this.selectionStore.selectedDocuments();
    if (selected.length === 0) {
      this.toastService.info('Nichts ausgewählt');
      return;
    }

    this.clipboardStore.addDocuments(selected);
    this.toastService.success(`${selected.length} Element(e) kopiert`);
    return true;
  }

  private cut(): boolean | void {
    if (!this.isInFilemanager()) {
      return;
    }

    const selected = this.selectionStore.selectedDocuments();
    if (selected.length === 0) {
      this.toastService.info('Nichts ausgewählt');
      return;
    }

    this.clipboardStore.addDocuments(selected);
    this.clipboardStore.setLastAction('move');
    this.selectionStore.clearSelection();
    this.toastService.success(`${selected.length} Element(e) ausgeschnitten`);
    return true;
  }

  private paste(): boolean | void {
    if (!this.isInFilemanager()) {
      return;
    }

    if (!this.filemanagerStore.selectedBucket()) {
      this.toastService.info('Kein Zielordner vorhanden');
      return;
    }

    const documents = this.clipboardStore.selectedDocuments();
    if (documents.length === 0) {
      this.toastService.info('Die Zwischenablage ist leer');
      return;
    }

    // Dieselben bewährten Store-Pfade wie der bestehende DnD-„Einfügen"-Fluss
    // (Ziel = aktueller Ordner; nach Erfolg räumt der Store die Zwischenablage
    // selbst auf). `lastAction === 'move'` = Ausschneiden, sonst Kopieren.
    if (this.clipboardStore.lastAction() === 'move') {
      this.filemanagerFacade.moveDocuments(documents);
    } else {
      this.filemanagerFacade.copyDocuments(documents);
    }
    return true;
  }

  private delete(): boolean | void {
    if (!this.isInFilemanager()) {
      return;
    }

    const selected = this.selectionStore.selectedDocuments();
    if (selected.length === 0) {
      this.toastService.info('Nichts ausgewählt');
      return;
    }

    // Der Store enthält bereits Bestätigungs-Dialog, Toast und Reload.
    this.filemanagerStore.deleteDocuments(selected);
    return true;
  }

  private rename(): boolean | void {
    if (!this.isInFilemanager()) {
      return;
    }

    const selected = this.selectionStore.selectedDocuments();
    if (selected.length !== 1) {
      return;
    }

    // Dieselbe Input-Dialog- + `DocumentsApi.moveDocument`-Abfolge (O3) wie im
    // Kontextmenü — keine zweite Implementierung.
    void this.contextMenuService.rename(selected[0]);
    return true;
  }

  private deselectAll(): boolean | void {
    if (!this.isInFilemanager()) {
      return;
    }

    if (this.selectionStore.selectedDocuments().length === 0) {
      return;
    }

    this.selectionStore.clearSelection();
    return true;
  }

  getShortcuts(): ShortcutHandler[] {
    return this.shortcuts;
  }
}

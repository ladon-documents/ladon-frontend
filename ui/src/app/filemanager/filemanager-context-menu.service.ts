import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Document } from '@ladon/api';
import { FavoritesStore } from '../store/favorites.store';
import { ContextMenuService } from '../shared/services/context-menu.service';
import { ConfirmationDialogService } from '../shared/services/confirmation-dialog.service';
import { InputDialogService } from '../shared/services/input-dialog.service';
import { ToastService } from '../shared/services/toast.service';
import { ConverterService } from '../services/converter.service';
import { ClipboardStore } from '../store/clipboard.store';
import { FilemanagerStore } from '../store/filemanager.store';
import { filemanagerHelper } from './helper/helper';
import { FilemanagerService } from './filemanager.service';

@Injectable({
  providedIn: 'root',
})
export class FilemanagerContextMenuService {
  readonly favoritesStore = inject(FavoritesStore);
  readonly contextMenuService = inject(ContextMenuService);
  readonly filemanagerService = inject(FilemanagerService);
  readonly clipboardStore = inject(ClipboardStore);
  readonly filemanagerStore = inject(FilemanagerStore);
  readonly toastService = inject(ToastService);
  readonly confirmationDialog = inject(ConfirmationDialogService);
  readonly inputDialogService = inject(InputDialogService);
  readonly converterService = inject(ConverterService);

  constructor() {}

  onContextMenu(
    event: MouseEvent,
    document: Document,
    actions?: {
      editImage?: () => void;
      openEditor?: () => void;
      openPdf?: () => void;
      openAudio?: () => void;
      openMedia?: () => void;
    },
    contextDocuments: Document[] = [document],
  ) {
    event.preventDefault();
    event.stopPropagation();

    const targetDocuments = contextDocuments.length > 0 ? contextDocuments : [document];
    const primaryDocument = targetDocuments[0] ?? document;
    const isMultiSelection = targetDocuments.length > 1;
    const allTargetsAreFavorites = targetDocuments.every((item) => this.favoritesStore.isFavorite(item));

    const menuItems = [
      ...(!isMultiSelection
        ? [
            {
              label: 'Download',
              icon: 'heroPencilSquare',
              action: () => this.download(primaryDocument),
            },
          ]
        : []),
      {
        label: isMultiSelection ? `Kopieren (${targetDocuments.length})` : 'Kopieren',
        icon: 'heroDocumentDuplicate',
        action: () => this.copy(targetDocuments),
      },
      ...(!isMultiSelection
        ? [
            {
              label: 'Umbenennen',
              icon: 'heroPencilSquare',
              action: () => this.rename(primaryDocument),
            },
            {
              label: 'Link kopieren',
              icon: 'heroLink',
              action: () => this.copyLink(primaryDocument),
            },
          ]
        : []),
      ...(actions?.openEditor
        ? [
            {
              label: 'Im Editor öffnen',
              icon: 'heroPencilSquare',
              action: actions.openEditor,
            },
          ]
        : []),
      ...(actions?.openPdf
        ? [
            {
              label: 'PDF anzeigen',
              icon: 'heroEye',
              action: actions.openPdf,
            },
          ]
        : []),
      ...(actions?.openAudio
        ? [
            {
              label: 'Audio abspielen',
              icon: 'heroEye',
              action: actions.openAudio,
            },
          ]
        : []),
      ...(actions?.openMedia
        ? [
            {
              label: 'Im Media Player öffnen',
              icon: 'heroEye',
              action: actions.openMedia,
            },
          ]
        : []),
      ...(!isMultiSelection && filemanagerHelper.isImage(primaryDocument) && actions?.editImage
        ? [
            {
              label: 'Bild bearbeiten',
              icon: 'heroPencilSquare',
              action: actions.editImage,
            },
          ]
        : []),
      { divider: true, label: '1', icon: '', action: () => {} },
      {
        label: allTargetsAreFavorites ? 'Von Favoriten entfernen' : 'Zu Favoriten hinzufügen',
        icon: 'heroStar',
        action: () => this.toggleFavorites(targetDocuments),
      },
      ...(!isMultiSelection
        ? [
            { divider: true, label: '2', icon: '', action: () => {} },
            {
              label: 'Eigenschaften',
              icon: 'heroInformationCircle',
              action: () => this.showProperties(primaryDocument),
            },
            { divider: true, label: '3', icon: '', action: () => {} },
          ]
        : []),
      {
        label: isMultiSelection ? `Löschen (${targetDocuments.length})` : 'Löschen',
        icon: 'heroTrash',
        danger: true,
        action: () => this.delete(targetDocuments),
      },
    ];

    this.contextMenuService.show(event.clientX, event.clientY, menuItems);
  }

  /**
   * Öffnet den Rename-Dialog (Input-Validator + `DocumentsApi.moveDocument`, O3).
   * Öffentlich, damit auch die Tastatur-Shortcuts (F2) dieselbe bewährte
   * Abfolge nutzen statt eine eigene zu erfinden.
   */
  async rename(document: Document) {
    const currentKey = document.key || document.path || '';

    if (!document.bucket || !currentKey) {
      this.toastService.error('Umbenennen nicht möglich: fehlender Bucket oder Key');
      return;
    }

    const bucket = document.bucket;
    const invalidChars = /[<>:"/\\|?*]/;
    const newName = await this.inputDialogService.prompt({
      title: 'Umbenennen',
      label: 'Neuer Name',
      placeholder: document.name || currentKey,
      confirmText: 'Umbenennen',
      cancelText: 'Abbrechen',
      validator: (value) => value.trim().length > 0 && !invalidChars.test(value.trim()),
      errorMessage: 'Namen dürfen nicht leer sein und keine der Zeichen < > : " / \\ | ? * enthalten',
    });

    if (!newName) {
      return;
    }

    const trimmedName = newName.trim();
    const directory = currentKey.includes('/') ? currentKey.slice(0, currentKey.lastIndexOf('/') + 1) : '';
    const targetKey = `${directory}${trimmedName}`;

    if (targetKey === currentKey) {
      return;
    }

    try {
      await firstValueFrom(this.filemanagerService.moveDocument(document, bucket, targetKey));
      this.filemanagerStore
        .reloadCurrentLocation()
        .subscribe({ next: () => undefined, error: () => undefined });
      this.toastService.success(`„${document.name || currentKey}" wurde umbenannt`);
    } catch (error) {
      this.toastService.error(`Umbenennen fehlgeschlagen: ${this.errorMessage(error)}`);
    }
  }

  private copy(documents: Document[]) {
    this.clipboardStore.addDocuments(documents);
  }

  private async download(document: Document) {
    const fileName = this.extractFileName(document);

    try {
      const response = await firstValueFrom(this.filemanagerService.getDocument(document));
      const blob = response instanceof Blob ? response : new Blob([response as BlobPart]);
      const url = URL.createObjectURL(blob);
      this.triggerDownload(url, fileName);
    } catch (error) {
      this.toastService.error(`Download fehlgeschlagen: ${this.errorMessage(error)}`);
    }
  }

  private copyLink(document: Document) {
    const bucket = document.bucket || '';
    const id = document.key || document.path || '';

    if (!bucket || !id) {
      this.toastService.error('Link kopieren nicht möglich: fehlende Datei-Identität');
      return;
    }

    const url = this.converterService.getDirectLink(bucket, id);

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => this.toastService.success('Link in die Zwischenablage kopiert'))
        .catch(() => this.toastService.error('Link konnte nicht in die Zwischenablage kopiert werden'));
    } else {
      this.toastService.info(`Link (manuell kopieren): ${url}`);
    }
  }

  private showProperties(document: Document) {
    const properties = this.buildProperties(document);

    void this.confirmationDialog.confirm({
      title: `Eigenschaften — ${this.extractFileName(document)}`,
      message: properties.join('\n'),
      confirmText: 'Schließen',
      cancelText: undefined,
      danger: false,
    });
  }

  private buildProperties(document: Document): string[] {
    const lines: string[] = [];
    lines.push(`Name: ${this.extractFileName(document)}`);

    if (document.path || document.key) {
      lines.push(`Pfad: ${document.path || document.key}`);
    }

    lines.push(`Typ: ${document.isFolder ? 'Ordner' : 'Datei'}`);

    if (document.contentType) {
      lines.push(`Inhaltstyp: ${document.contentType}`);
    }

    if (typeof document.size === 'number') {
      lines.push(`Größe: ${this.formatSize(document.size)}`);
    }

    if (document.created) {
      lines.push(`Erstellt: ${this.formatDate(document.created)}`);
    }

    if (document.lastModified) {
      lines.push(`Geändert: ${this.formatDate(document.lastModified)}`);
    }

    if (document.etag) {
      lines.push(`ETag: ${document.etag}`);
    }

    if (document.owner) {
      lines.push(`Eigentümer: ${document.owner}`);
    }

    if (document.version !== undefined && document.version !== null) {
      lines.push(`Version: ${document.version}`);
    }

    if (document.bucket) {
      lines.push(`Bucket: ${document.bucket}`);
    }

    return lines;
  }

  private formatSize(size: number): string {
    if (size >= 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
    if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (size >= 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${size} B`;
  }

  private formatDate(value: string | number): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }

  private extractFileName(document: Document): string {
    const key = document.key || document.path || document.name || 'datei';
    const lastSlash = key.lastIndexOf('/');
    return lastSlash >= 0 ? key.substring(lastSlash + 1) : key;
  }

  private triggerDownload(url: string, fileName: string): void {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  private errorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object') {
      const message = (error as { message?: string }).message;
      if (typeof message === 'string') {
        return message;
      }
    }
    return 'Unbekannter Fehler';
  }

  private deleteDocument(document: Document) {
    this.filemanagerStore.deleteDocument(document);
  }

  private deleteDocuments(documents: Document[]) {
    this.filemanagerStore.deleteDocuments(documents);
  }

  private delete(documents: Document[]) {
    if (documents.length > 1) {
      this.deleteDocuments(documents);
      return;
    }

    const singleDocument = documents[0];
    if (singleDocument) {
      this.deleteDocument(singleDocument);
    }
  }

  private toggleFavorites(documents: Document[]) {
    if (documents.length === 0) {
      return;
    }

    const allFavorites = documents.every((item) => this.favoritesStore.isFavorite(item));

    documents.forEach((item) => {
      if (allFavorites) {
        this.favoritesStore.removeFavorite(item);
      } else if (!this.favoritesStore.isFavorite(item)) {
        this.favoritesStore.addFavorite(item);
      }
    });
  }
}

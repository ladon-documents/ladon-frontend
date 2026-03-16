import { inject, Injectable } from '@angular/core';
import { DocumentModel } from '../../api';
import { FavoritesStore } from '../store/favorites.store';
import { ContextMenuService } from '../shared/services/context-menu.service';
import { ClipboardStore } from '../store/clipboard.store';
import { FilemanagerStore } from '../store/filemanager.store';
import { filemanagerHelper } from './helper/helper';

@Injectable({
  providedIn: 'root',
})
export class FilemanagerContextMenuService {
  readonly favoritesStore = inject(FavoritesStore);
  readonly contextMenuService = inject(ContextMenuService);
  readonly clipboardStore = inject(ClipboardStore);
  readonly filemanagerStore = inject(FilemanagerStore);

  constructor() {}

  onContextMenu(
    event: MouseEvent,
    document: DocumentModel,
    actions?: {
      editImage?: () => void;
      openEditor?: () => void;
      openPdf?: () => void;
      openAudio?: () => void;
      openMedia?: () => void;
    },
    contextDocuments: DocumentModel[] = [document],
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

  private rename(document: DocumentModel) {
    console.log('Rename:', document.key);
  }

  private copy(documents: DocumentModel[]) {
    this.clipboardStore.addDocuments(documents);
  }

  private download(document: DocumentModel) {
  //  this.filemanagerStore.get(document);
  }

  private copyLink(document: DocumentModel) {
    console.log('Copy link:', document.key);
  }

  private showProperties(document: DocumentModel) {
    console.log('Show properties:', document.key);
  }

  private deleteDocument(document: DocumentModel) {
    this.filemanagerStore.deleteDocument(document);
  }

  private deleteDocuments(documents: DocumentModel[]) {
    this.filemanagerStore.deleteDocuments(documents);
  }

  private delete(documents: DocumentModel[]) {
    if (documents.length > 1) {
      this.deleteDocuments(documents);
      return;
    }

    const singleDocument = documents[0];
    if (singleDocument) {
      this.deleteDocument(singleDocument);
    }
  }

  private toggleFavorites(documents: DocumentModel[]) {
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

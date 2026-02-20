import { inject, Injectable } from '@angular/core';
import { DocumentModel } from '../../api';
import { FavoritesStore } from '../store/favorites.store';
import { ContextMenuService } from '../shared/services/context-menu.service';
import { ClipboardStore } from '../store/clipboard.store';
import { FilemanagerStore } from '../store/filemanager.store';

@Injectable({
  providedIn: 'root',
})
export class FilemanagerContextMenuService {
  readonly favoritesStore = inject(FavoritesStore);
  readonly contextMenuService = inject(ContextMenuService);
  readonly clipboardStore = inject(ClipboardStore);
  readonly filemanagerStore = inject(FilemanagerStore);

  constructor() {}

  onContextMenu(event: MouseEvent, document: DocumentModel) {
    event.preventDefault();
    event.stopPropagation();

    const menuItems = [
      {
        label: 'Download',
        icon: 'heroPencilSquare',
        action: () => this.download(document),
      },
      {
        label: 'Kopieren',
        icon: 'heroDocumentDuplicate',
        action: () => this.copy(document),
      },
      {
        label: 'Umbenennen',
        icon: 'heroPencilSquare',
        action: () => this.rename(document),
      },
      {
        label: 'Link kopieren',
        icon: 'heroLink',
        action: () => this.copyLink(document),
      },
      { divider: true, label: '1', icon: '', action: () => {} },
      {
        label: this.favoritesStore.isFavorite(document) ? 'Von Favoriten entfernen' : 'Zu Favoriten',
        icon: 'heroStar',
        action: () => this.favoritesStore.toggleFavorite(document),
      },
      { divider: true, label: '2', icon: '', action: () => {} },
      {
        label: 'Eigenschaften',
        icon: 'heroInformationCircle',
        action: () => this.showProperties(document),
      },
      { divider: true, label: '3', icon: '', action: () => {} },
      {
        label: 'Löschen',
        icon: 'heroTrash',
        danger: true,
        action: () => this.deleteDocument(document),
      },
    ];

    this.contextMenuService.show(event.clientX, event.clientY, menuItems);
  }

  private rename(document: DocumentModel) {
    console.log('Rename:', document.key);
  }

  private copy(document: DocumentModel) {
    this.clipboardStore.addDocument(document);
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
}

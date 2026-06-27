import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Document } from '@ladon/api';
import { FilemanagerFacade } from './filemanager.facade';
import { MonacoEditorService } from '../editor/editor.service';
import { ToastService } from '../shared/services/toast.service';
import { filemanagerHelper } from './helper/helper';

export type FilemanagerWorkspaceMode = 'browser' | 'editor' | 'image-editor' | 'pdf-viewer' | 'media-player';

interface ImageEditorSaveEventDetail {
  blob: Blob;
  fileName: string;
}

@Injectable({
  providedIn: 'root',
})
export class FilemanagerWorkspaceService {
  private readonly filemanagerFacade = inject(FilemanagerFacade);
  private readonly monacoEditorService = inject(MonacoEditorService);
  private readonly toastService = inject(ToastService);

  private readonly _mode = signal<FilemanagerWorkspaceMode>('browser');
  private readonly _isPreparing = signal(false);
  private readonly _imageEditorSourceUrl = signal<string | null>(null);
  private readonly _imageEditorFileName = signal('');
  private readonly _imageEditorMimeType = signal('image/png');
  private readonly _imageEditorDocument = signal<Document | null>(null);
  private readonly _mediaPlayerSourceUrl = signal<string | null>(null);
  private readonly _mediaPlayerType = signal<'audio' | 'video' | 'image' | 'auto'>('auto');
  private readonly _mediaPlayerFileName = signal('');
  private readonly _pdfSource = signal<string | null>(null);

  readonly mode = this._mode.asReadonly();
  readonly isPreparing = this._isPreparing.asReadonly();
  readonly imageEditorSourceUrl = this._imageEditorSourceUrl.asReadonly();
  readonly imageEditorFileName = this._imageEditorFileName.asReadonly();
  readonly imageEditorMimeType = this._imageEditorMimeType.asReadonly();
  readonly mediaPlayerSourceUrl = this._mediaPlayerSourceUrl.asReadonly();
  readonly mediaPlayerType = this._mediaPlayerType.asReadonly();
  readonly mediaPlayerFileName = this._mediaPlayerFileName.asReadonly();
  readonly pdfSource = this._pdfSource.asReadonly();

  openEditor(document: Document): void {
    this.filemanagerFacade.setSelectedDocument(document);
    this.clearTransientPayload();
    this._mode.set('editor');
    this.monacoEditorService.open();
  }

  async openImageEditor(document: Document): Promise<void> {
    this.filemanagerFacade.setSelectedDocument(document);
    this.clearTransientPayload();
    this._isPreparing.set(true);

    try {
      const response = await firstValueFrom(this.filemanagerFacade.getDocument(document));
      const blob = response instanceof Blob ? response : new Blob([response]);

      this.revokeImageEditorSourceUrl();
      this._imageEditorSourceUrl.set(URL.createObjectURL(blob));
      this._imageEditorFileName.set(this.extractFileName(document));
      this._imageEditorMimeType.set(document.contentType || blob.type || 'image/png');
      this._imageEditorDocument.set(document);
      this._mode.set('image-editor');
    } catch (error) {
      this.toastService.error(`Bild konnte nicht geladen werden: ${String(error)}`);
    } finally {
      this._isPreparing.set(false);
    }
  }

  async saveImageEditor(event: Event): Promise<void> {
    const detail = (event as CustomEvent<ImageEditorSaveEventDetail>).detail;
    const sourceDocument = this._imageEditorDocument();
    if (!detail?.blob || !sourceDocument) {
      return;
    }

    const targetDocument = this.buildTargetDocumentForImageSave(sourceDocument, detail.fileName);

    try {
      await firstValueFrom(this.filemanagerFacade.saveDocument(targetDocument, detail.blob));
      this.filemanagerFacade.reloadCurrentLocation();
      this.closeImageEditor();
      this.toastService.success('Bild erfolgreich gespeichert');
    } catch (error) {
      this.toastService.error(`Bild konnte nicht gespeichert werden: ${String(error)}`);
    }
  }

  openPdfViewer(document: Document): void {
    this.filemanagerFacade.setSelectedDocument(document);
    this.clearTransientPayload();
    this._pdfSource.set(document.key || document.path || document.name || null);
    this._mode.set('pdf-viewer');
  }

  async openMediaPlayer(document: Document): Promise<void> {
    this.filemanagerFacade.setSelectedDocument(document);
    this.clearTransientPayload();
    this._isPreparing.set(true);

    try {
      const response = await firstValueFrom(this.filemanagerFacade.getDocument(document));
      const contentType = document.contentType || undefined;
      const blob = response instanceof Blob ? response : new Blob([response], { type: contentType });

      this.revokeMediaPlayerSourceUrl();
      this._mediaPlayerSourceUrl.set(URL.createObjectURL(blob));
      this._mediaPlayerType.set(this.resolveMediaType(document));
      this._mediaPlayerFileName.set(this.extractFileName(document));
      this._mode.set('media-player');
    } catch (error) {
      this.toastService.error(`Mediendatei konnte nicht geladen werden: ${String(error)}`);
    } finally {
      this._isPreparing.set(false);
    }
  }

  closeActiveView(): void {
    if (this._mode() === 'editor') {
      this.monacoEditorService.close();
      return;
    }

    this.resetToBrowser();
  }

  closeEditorViewAfterEditorClosed(): void {
    if (this._mode() !== 'editor') {
      return;
    }

    this.resetToBrowser();
  }

  closeImageEditor(): void {
    this.resetToBrowser();
  }

  private resetToBrowser(): void {
    this._mode.set('browser');
    this._isPreparing.set(false);
    this.clearTransientPayload();
  }

  private clearTransientPayload(): void {
    this._pdfSource.set(null);
    this._mediaPlayerFileName.set('');
    this._mediaPlayerType.set('auto');
    this.revokeMediaPlayerSourceUrl();
    this._imageEditorDocument.set(null);
    this._imageEditorFileName.set('');
    this._imageEditorMimeType.set('image/png');
    this.revokeImageEditorSourceUrl();
  }

  private buildTargetDocumentForImageSave(document: Document, fileName: string): Document {
    const normalizedFileName = fileName.trim().replace(/^\/+/, '');
    if (!normalizedFileName) {
      return document;
    }

    const currentKey = document.key || document.path || '';
    const lastSlash = currentKey.lastIndexOf('/');
    const directory = lastSlash >= 0 ? currentKey.substring(0, lastSlash + 1) : '';
    const targetKey = `${directory}${normalizedFileName}`;

    return {
      ...document,
      key: targetKey,
      path: targetKey,
      name: normalizedFileName,
      contentType: document.contentType,
    };
  }

  private resolveMediaType(document: Document): 'audio' | 'video' | 'image' | 'auto' {
    if (filemanagerHelper.isAudio(document)) {
      return 'audio';
    }
    if (filemanagerHelper.isVideo(document)) {
      return 'video';
    }
    if (filemanagerHelper.isImage(document)) {
      return 'image';
    }

    return 'auto';
  }

  private extractFileName(document: Document): string {
    const key = document.key || document.path || document.name || 'document';
    const lastSlash = key.lastIndexOf('/');
    return lastSlash >= 0 ? key.substring(lastSlash + 1) : key;
  }

  private revokeImageEditorSourceUrl(): void {
    const currentUrl = this._imageEditorSourceUrl();
    if (!currentUrl) {
      return;
    }

    URL.revokeObjectURL(currentUrl);
    this._imageEditorSourceUrl.set(null);
  }

  private revokeMediaPlayerSourceUrl(): void {
    const currentUrl = this._mediaPlayerSourceUrl();
    if (!currentUrl) {
      return;
    }

    URL.revokeObjectURL(currentUrl);
    this._mediaPlayerSourceUrl.set(null);
  }
}

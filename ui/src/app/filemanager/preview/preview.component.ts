import { Component, CUSTOM_ELEMENTS_SCHEMA, effect, inject, OnDestroy } from '@angular/core';
import { FilemanagerFacade } from '../filemanager.facade';
import { Document } from '@ladon/api';
import { filemanagerHelper } from '../helper/helper';
import { FilemanagerWorkspaceService } from '../filemanager-workspace.service';
import { DocumentTagsComponent } from '../../shared/components/document-tags/document-tags.component';

@Component({
  selector: 'filemanager-preview',
  imports: [DocumentTagsComponent],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PreviewComponent implements OnDestroy {
  private readonly filemanagerFacade = inject(FilemanagerFacade);
  private readonly workspaceService = inject(FilemanagerWorkspaceService);

  selectedDocument = this.filemanagerFacade.selectedDocument;
  imageUrl: string | null = null;
  isLoading = false;
  filename = '';

  constructor() {
    effect(() => {
      const document = this.selectedDocument();

      if (document) {
        this.filename = document.name || '';
        if (!document.isFolder) {
          void this.loadPreview(document);
        } else {
          this.revokePreviewUrls();
        }
      } else {
        this.filename = '';
        this.revokePreviewUrls();
      }
    });
  }

  ngOnDestroy(): void {
    this.revokePreviewUrls();
  }

  private async loadPreview(document: Document) {
    this.revokePreviewUrls();
    this.isLoading = true;
    try {
      if (filemanagerHelper.isImage(document)) {
        this.imageUrl = await this.filemanagerFacade.getImagePreviewUrll();
      } else {
        this.imageUrl = null;
      }
    } catch (error) {
      console.error('Fehler beim Laden der Vorschau:', error);
    } finally {
      this.isLoading = false;
    }
  }

  onImageError(event: any) {
    console.error('Fehler beim Anzeigen des Bildes:', event);
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl);
      this.imageUrl = null;
    }
  }

  private revokePreviewUrls() {
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl);
    }
    this.imageUrl = null;
  }

  hasPrimaryAction(): boolean {
    const document = this.selectedDocument();
    if (!document || document.isFolder) {
      return false;
    }

    return filemanagerHelper.isPdf(document) || filemanagerHelper.isEditableFile(document.key || document.name || '');
  }

  getPrimaryActionLabel(): string {
    const document = this.selectedDocument();
    if (document && filemanagerHelper.isPdf(document)) {
      return 'PDF Viewer öffnen';
    }

    return 'Im Editor öffnen';
  }

  openPrimaryAction(): void {
    const document = this.selectedDocument();
    if (!document || document.isFolder) {
      return;
    }

    if (filemanagerHelper.isPdf(document)) {
      this.workspaceService.openPdfViewer(document);
      return;
    }

    if (filemanagerHelper.isEditableFile(document.key || document.name || '')) {
      this.workspaceService.openEditor(document);
    }
  }
}

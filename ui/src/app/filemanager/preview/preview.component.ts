import { Component, CUSTOM_ELEMENTS_SCHEMA, effect, inject, signal, untracked } from '@angular/core';
import { FilemanagerFacade } from '../filemanager.facade';
import { DocumentModel } from '@ladon/api';
import { MonacoEditorService } from '../../editor/editor.service';
import { filemanagerHelper } from '../helper/helper';
import { PdfViewerFacade } from '../../pdf-viewer/pdf-viewer.facade';
import { FilemanagerTagsFacade } from '../tags/filemanager-tags.facade';
import { PillComponent } from '../../shared/components/pill/pill.component';

@Component({
  selector: 'filemanager-preview',
  imports: [PillComponent],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PreviewComponent {
  readonly monacoEditorService = inject(MonacoEditorService);
  private readonly filemanagerFacade = inject(FilemanagerFacade);
  private readonly pdfViewerFacade = inject(PdfViewerFacade);
  private readonly filemanagerTagsFacade = inject(FilemanagerTagsFacade);

  selectedDocument = this.filemanagerFacade.selectedDocument;
  readonly tags = this.filemanagerTagsFacade.tags;
  readonly isTagsLoading = this.filemanagerTagsFacade.isLoading;
  readonly isTagsMutating = this.filemanagerTagsFacade.isMutating;
  readonly tagsError = this.filemanagerTagsFacade.error;
  readonly tagsDocumentId = this.filemanagerTagsFacade.documentId;

  readonly tagInput = signal('');
  imageUrl: string | null = null;
  isLoading = false;
  filename = '';

  constructor() {
    effect(() => {
      const document = this.selectedDocument();
      untracked(() => {
        if (document && !document.isFolder) {
          this.filemanagerTagsFacade.loadForDocument(document);
        } else {
          this.filemanagerTagsFacade.clearState();
        }
      });
      this.tagInput.set('');

      if (document) {
        this.filename = document.name || '';
        if (!document.isFolder) {
          this.loadPreview(document);
        } else {
          this.revokeImageUrl();
        }
      } else {
        this.filename = '';
        this.revokeImageUrl();
      }
    });
  }

  private async loadPreview(document: DocumentModel) {
    this.revokeImageUrl();
    this.isLoading = true;
    try {
      if (!filemanagerHelper.isAudio(document)) {
        this.imageUrl = await this.filemanagerFacade.getImagePreviewUrll();
      }
    } catch (error) {
      console.error('Fehler beim Laden der Vorschau:', error);
    } finally {
      this.isLoading = false;
    }
  }

  onImageError(event: any) {
    console.error('Fehler beim Anzeigen des Bildes:', event);
    this.revokeImageUrl();
  }

  private revokeImageUrl() {
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl);
    }
    this.imageUrl = null;
  }

  openEditor() {
    this.monacoEditorService.open();
  }

  async openPdf() {
    const document = this.selectedDocument();
    if (document) {
      await this.pdfViewerFacade.navigateToPdfViewer(document);
    }
  }

  onTagInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.tagInput.set(target.value);
  }

  onTagKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    }
  }

  addTag() {
    const value = this.tagInput().trim();
    if (!value || this.isTagsMutating() || !this.tagsDocumentId()) {
      return;
    }

    this.filemanagerTagsFacade.addTag(value);
    this.tagInput.set('');
  }

  deleteTag(tagId: string) {
    if (!tagId || this.isTagsMutating()) {
      return;
    }
    this.filemanagerTagsFacade.deleteTag(tagId);
  }

  protected readonly filemanagerHelper = filemanagerHelper;
}

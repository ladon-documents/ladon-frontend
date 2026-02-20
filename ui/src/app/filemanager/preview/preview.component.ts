import { Component, CUSTOM_ELEMENTS_SCHEMA, effect, inject } from '@angular/core';
import { FilemanagerFacade } from '../filemanager.facade';
import { DocumentModel } from '@ladon/api';
import { SidebarService } from '../sidebar/sidebar.service';
import { MonacoEditorService } from '../../editor/editor.service';
import { filemanagerHelper } from '../helper/helper';
import { LadonRouterService } from '../../services/ladon-router.service';
import { PdfViewerFacade } from '../../pdf-viewer/pdf-viewer.facade';

@Component({
  selector: 'filemanager-preview',
  imports: [],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PreviewComponent {
  readonly monacoEditorService = inject(MonacoEditorService);
  private readonly filemanagerFacade = inject(FilemanagerFacade);
  private readonly pdfViewerFacade = inject(PdfViewerFacade);

  selectedDocument = this.filemanagerFacade.selectedDocument;
  imageUrl: string | null = null;
  isLoading = false;
  filename = '';

  constructor(private sidebarService: SidebarService) {
    effect(() => {
      const document = this.selectedDocument();
      if (document) {
        this.filename = document.key || '';
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

  protected readonly filemanagerHelper = filemanagerHelper;
}

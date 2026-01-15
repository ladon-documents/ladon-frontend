import {
  Component,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  signal,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentModel } from '../../api';
import { FilemanagerFacade } from '../filemanager/filemanager.facade';
import { ActivatedRoute } from '@angular/router';
import { PdfViewerFacade } from './pdf-viewer.facade';
import { pdfviewerRoutes } from './pdf-viewer.routes';

@Component({
  selector: 'pdf-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: 'pdf-viewer.component.html',
//  styleUrls: ['pdf-viewer.component.scss'],
})
export class PdfViewerComponent implements OnInit {
  @ViewChild('pdfViewerWC', { static: false }) pdfViewerWC!: ElementRef;

  private readonly filemanagerFacade = inject(FilemanagerFacade);
  private readonly pdfFacade = inject(PdfViewerFacade);

  private readonly activatedRoute = inject(ActivatedRoute);
  readonly selectedDocument = this.pdfFacade.selectedDocument;
  readonly isLoading = this.pdfFacade.isLoading;
  readonly currentPage = this.pdfFacade.currentPage;
  readonly totalPages = this.pdfFacade.totalPages;
  readonly zoomLevel = this.pdfFacade.zoomLevel;
  readonly hasError = this.pdfFacade.hasError;
  readonly errorMessage = this.pdfFacade.errorMessage;

  private _selectedDocument = signal<DocumentModel | null>(null);
  private _isLoading = signal<boolean>(false);
  private _hasError = signal<boolean>(false);
  private _errorMessage = signal<string>('');
  private _totalPages = signal<number>(0);
  private _zoomLevel = signal<number>(100);
  private _loadingProgress = signal<number>(0);
  private _showToolbar = signal<boolean>(true);

  readonly loadingProgress = this._loadingProgress.asReadonly();
  readonly showToolbar = this._showToolbar.asReadonly();
  pdfName = signal('');
  readonly pdfUrl = computed(() => {
    const doc = this.selectedDocument();
    if (!doc || !doc.bucket || !doc.key) return '';

    // Generiert die URL basierend auf dem DocumentModel
    return `/admin/api/filemanager/${encodeURIComponent(doc.bucket)}/direct?id=${encodeURIComponent(doc.key)}`;
  });

  readonly isPdfReady = computed(() => !this.isLoading() && !this.hasError() && this.selectedDocument() !== null);

  constructor() {
    effect(() => {
      const storeDocument = this.filemanagerFacade.selectedDocument();
      if (storeDocument && this.isPdfDocument(storeDocument) && storeDocument !== this.selectedDocument()) {
        this._selectedDocument.set(storeDocument);
        this.loadPdf();
      }
    });

    effect(() => {
      if (this.selectedDocument()) {
        this.resetState();
      }
    });
  }

  ngOnInit() {
    this.activatedRoute.data.subscribe((data) => {
      const selectedDocument = data['selectedDocument'];
      console.log(selectedDocument);
      if (selectedDocument) {
        this._selectedDocument.set(selectedDocument);
        this.pdfName.set(selectedDocument.name);
        //this.loadPdf();
      }
    });

    this.activatedRoute.queryParams.subscribe((params) => {
      const pdfName = params['name'];
      if (pdfName) {
        this.pdfName.set(params['name']);
        const storeDocument = this.filemanagerFacade.selectedDocument();
        if (storeDocument && this.isPdfDocument(storeDocument)) {
          this._selectedDocument.set(storeDocument);
          this.loadPdf();
        }
      } else {
        const storeDocument = this.filemanagerFacade.selectedDocument();
        if (storeDocument && this.isPdfDocument(storeDocument)) {
          this._selectedDocument.set(storeDocument);
          this.loadPdf();
        }
      }
    });
  }

  private isPdfDocument(document: DocumentModel): boolean {
    if (!document) return false;

    const contentType = document['content-type']?.toLowerCase();
    const fileName = document.key || document.name || '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    return contentType === 'application/pdf' || fileExtension === 'pdf';
  }

  private resetState(): void {
    this.pdfFacade.resetState();
  }

  private loadPdf(): void {
    /*
    const document = this.selectedDocument();
    if (!document) return;

     */

    this._isLoading.set(false);
    this._hasError.set(false);
    this._errorMessage.set('');
  }

  onPdfLoaded(event: CustomEvent<any>): void {
    this.pdfFacade.onPdfLoaded(event.detail.totalPages);
  }

  onPdfError(event: CustomEvent<any>): void {
    console.error('PDF error:', event.detail);
    this.pdfFacade.onError(event.detail.message || 'Unbekannter Fehler beim Laden der PDF');
  }

  onPageChanged(event: CustomEvent<any>): void {
    const page = event.detail.page || 1;
    // this._currentPage.set(page);
  }

  onLoadProgress(event: CustomEvent<any>): void {
    const progress = Math.round(event.detail.progress || 0);
    this.pdfFacade.onLoadingProgress(progress);
  }

  // Toolbar Actions
  zoomIn(): void {
    this.pdfFacade.zoomIn();
  }

  zoomOut(): void {
    this.pdfFacade.zoomOut();
  }

  resetZoom(): void {
    this.pdfFacade.resetZoom();
  }

  previousPage(): void {
    this.pdfFacade.previousPage();
  }

  nextPage(): void {
    this.pdfFacade.nextPage();
  }

  goToPage(page: number): void {
    this.pdfFacade.goToPage(page);
  }

  private updateWebComponentPage(): void {
    if (this.pdfViewerWC?.nativeElement) {
      this.pdfViewerWC.nativeElement.page = this.currentPage();
    }
  }

  downloadPdf(): void {
    /*
    const document = this.selectedDocument();
    if (this.isPdfReady() && document) {
      this.downloadRequested.emit({ document });

      this.filemanagerFacade.getDocument(document).subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.getDocumentDisplayName();
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      });
    }

     */
  }

  printPdf(): void {
    const document = this.selectedDocument();
    if (this.isPdfReady() && document) {
      // Web Component print method aufrufen falls verfügbar
      if (this.pdfViewerWC?.nativeElement?.print) {
        this.pdfViewerWC.nativeElement.print();
      } else {
        // Fallback: PDF in neuem Tab öffnen zum Drucken
        window.open(this.pdfUrl(), '_blank');
      }
    }
  }

  toggleFullscreen(): void {
    if (this.pdfViewerWC?.nativeElement?.requestFullscreen) {
      this.pdfViewerWC.nativeElement.requestFullscreen();
    } else if ((this.pdfViewerWC?.nativeElement as any)?.webkitRequestFullscreen) {
      (this.pdfViewerWC.nativeElement as any).webkitRequestFullscreen();
    }
  }

  closePdfViewer(): void {
    //   this.closed.emit({ document: this.selectedDocument() });
    this._selectedDocument.set(null);
    this.pdfName.set('');
    this.resetState();
  }

  retryLoad(): void {
    this.resetState();
    this.loadPdf();
  }

  // Helper Methods
  getDocumentDisplayName(): string {
    const document = this.selectedDocument();
    if (!document) return 'Dokument';

    return document.name || document.key || 'Unbekanntes Dokument';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }

  // Public API Methods
  reload(): void {
    this.retryLoad();
  }

  setDocument(document: DocumentModel): void {
    if (this.isPdfDocument(document)) {
      this._selectedDocument.set(document);
      this.loadPdf();
    }
  }

  getCurrentState() {
    return {
      document: this.selectedDocument(),
      page: this.currentPage(),
      totalPages: this.totalPages(),
      zoom: this.zoomLevel(),
      isLoading: this.isLoading(),
      hasError: this.hasError(),
      pdfUrl: this.pdfUrl(),
    };
  }
}

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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentModel } from '../../api';
import { FilemanagerFacade } from '../filemanager/filemanager.facade';

@Component({
  selector: 'pdf-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: 'pdf-viewer.component.html',
  styleUrls: ['pdf-viewer.component.scss'],
})
export class PdfViewerComponent {
  @ViewChild('pdfViewerWC', { static: false }) pdfViewerWC!: ElementRef;

  private readonly filemanagerFacade = inject(FilemanagerFacade);

  private _selectedDocument = signal<DocumentModel | null>(null);
  private _isLoading = signal<boolean>(false);
  private _hasError = signal<boolean>(false);
  private _errorMessage = signal<string>('');
  private _currentPage = signal<number>(1);
  private _totalPages = signal<number>(0);
  private _zoomLevel = signal<number>(100);
  private _loadingProgress = signal<number>(0);
  private _showToolbar = signal<boolean>(true);

  readonly selectedDocument = this._selectedDocument.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly hasError = this._hasError.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly zoomLevel = this._zoomLevel.asReadonly();
  readonly loadingProgress = this._loadingProgress.asReadonly();
  readonly showToolbar = this._showToolbar.asReadonly();

  readonly pdfUrl = computed(() => {
    const doc = this.selectedDocument();
    if (!doc || !doc.bucket || !doc.key) return '';

    // Generiert die URL basierend auf dem DocumentModel
    return `/admin/api/filemanager/${encodeURIComponent(doc.bucket)}/direct?id=${encodeURIComponent(doc.key)}`;
  });

  readonly isPdfReady = computed(() => !this.isLoading() && !this.hasError() && this.selectedDocument() !== null);

  // Input Properties - unterstützt sowohl direkte DocumentModel als auch selectedDocument aus Store
  @Input() set document(value: DocumentModel | null) {
    if (value && this.isPdfDocument(value)) {
      this._selectedDocument.set(value);
      this.loadPdf();
    }
  }

  @Input() set useSelectedDocument(value: boolean) {
    if (value) {
      // Verwende selectedDocument aus dem FilemanagerStore
      const storeDocument = this.filemanagerFacade.selectedDocument();
      if (storeDocument && this.isPdfDocument(storeDocument)) {
        this._selectedDocument.set(storeDocument);
        this.loadPdf();
      }
    }
  }

  @Input() set toolbar(value: boolean) {
    this._showToolbar.set(value);
  }

  // Output Events
  @Output() pdfLoaded = new EventEmitter<{ document: DocumentModel; totalPages: number }>();
  @Output() pdfError = new EventEmitter<{ document: DocumentModel | null; error: string }>();
  @Output() pageChanged = new EventEmitter<{ document: DocumentModel | null; page: number; totalPages: number }>();
  @Output() downloadRequested = new EventEmitter<{ document: DocumentModel }>();
  @Output() printRequested = new EventEmitter<{ document: DocumentModel }>();
  @Output() closed = new EventEmitter<{ document: DocumentModel | null }>();

  constructor() {
    // Effect für automatisches Laden bei Änderungen des selectedDocument im Store
    effect(() => {
      const storeDocument = this.filemanagerFacade.selectedDocument();
      if (storeDocument && this.isPdfDocument(storeDocument) && storeDocument !== this.selectedDocument()) {
        this._selectedDocument.set(storeDocument);
        this.loadPdf();
      }
    });

    // Effect für automatisches Laden bei Dokumentänderungen
    effect(() => {
      if (this.selectedDocument()) {
        this.resetState();
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
    this._hasError.set(false);
    this._errorMessage.set('');
    this._currentPage.set(1);
    this._totalPages.set(0);
    this._loadingProgress.set(0);
  }

  private loadPdf(): void {
    const document = this.selectedDocument();
    if (!document) return;

    this._isLoading.set(true);
    this._hasError.set(false);
    this._errorMessage.set('');
  }

  // Event Handlers für Web Component
  onPdfLoaded(event: CustomEvent<any>): void {
    console.log('PDF loaded:', event.detail);
    this._isLoading.set(false);
    this._totalPages.set(event.detail.totalPages || 0);

    const document = this.selectedDocument();
    if (document) {
      this.pdfLoaded.emit({ document, totalPages: this.totalPages() });
    }
  }

  onPdfError(event: CustomEvent<any>): void {
    console.error('PDF error:', event.detail);
    this._isLoading.set(false);
    this._hasError.set(true);
    this._errorMessage.set(event.detail.message || 'Unbekannter Fehler beim Laden der PDF');

    this.pdfError.emit({
      document: this.selectedDocument(),
      error: this.errorMessage(),
    });
  }

  onPageChanged(event: CustomEvent<any>): void {
    const page = event.detail.page || 1;
    this._currentPage.set(page);

    this.pageChanged.emit({
      document: this.selectedDocument(),
      page: this.currentPage(),
      totalPages: this.totalPages(),
    });
  }

  onLoadProgress(event: CustomEvent<any>): void {
    const progress = Math.round(event.detail.progress || 0);
    this._loadingProgress.set(progress);
  }

  // Toolbar Actions
  zoomIn(): void {
    if (this.zoomLevel() < 300) {
      this._zoomLevel.set(this.zoomLevel() + 25);
    }
  }

  zoomOut(): void {
    if (this.zoomLevel() > 25) {
      this._zoomLevel.set(this.zoomLevel() - 25);
    }
  }

  resetZoom(): void {
    this._zoomLevel.set(100);
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this._currentPage.set(this.currentPage() - 1);
      this.updateWebComponentPage();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this._currentPage.set(this.currentPage() + 1);
      this.updateWebComponentPage();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this._currentPage.set(page);
      this.updateWebComponentPage();
    }
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
      this.printRequested.emit({ document });

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
    this.closed.emit({ document: this.selectedDocument() });
    this._selectedDocument.set(null);
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

import {Component, EventEmitter, HostListener, Input, Output} from "@angular/core";
import {CommonModule} from "@angular/common";
import {LadonPdfDownloadComponent} from "./components/ladon-pdf-download/ladon-pdf-download.component";
import {LadonPdfPagingComponent} from "./components/ladon-pdf-paging/ladon-pdf-paging.component";
import {
  LadonPdfPresentationModeComponent
} from "./components/ladon-pdf-presentation-mode/ladon-pdf-presentation-mode.component";
import {LadonPdfPrintComponent} from "./components/ladon-pdf-print/ladon-pdf-print.component";
import {LadonPdfRotateComponent} from "./components/ladon-pdf-rotate/ladon-pdf-rotate.component";
import {LadonPdfToggleSidebarComponent} from "./components/ladon-pdf-toggle-sidebar/ladon-pdf-toggle-sidebar.component";
import {LadonPdfZoomToolbarComponent} from "./components/ladon-pdf-zoom-toolbar/ladon-pdf-zoom-toolbar.component";
import {NgxExtendedPdfViewerModule, pdfDefaultOptions, PdfDownloadedEvent} from "ngx-extended-pdf-viewer";
import {WcLadonPdfviewerEvents} from "./events/wc-ladon-pdfviewer-events";

@Component({
  selector: "ladon-pdfviewer",
  standalone: true,
  imports: [ CommonModule, LadonPdfDownloadComponent, LadonPdfPagingComponent, LadonPdfPresentationModeComponent, LadonPdfPrintComponent, LadonPdfRotateComponent, LadonPdfToggleSidebarComponent, LadonPdfZoomToolbarComponent, NgxExtendedPdfViewerModule],
  templateUrl: "./pdfviewer.component.html",
  styleUrl: "./pdfviewer.component.css",
})
export class PdfviewerComponent {

  appIsReady: boolean = false;
  pdfurl: any;
  error: boolean = false;
  isLoading: boolean = false;
  progress: any;
  progressCount: any;

  private readonly path: string = "/admin/api/filemanager";
  private pdfSrc: string = "";
  private readonly deployTarget = "./core-wc/ladon-pdfviewer/assets"
  private readonly pdfVersion = "/pdf.worker-4.7.708.min.mjs";

  @Input()
  set pdf(pdfSrc: string) {
    pdfDefaultOptions.assetsFolder = this.deployTarget;
    pdfDefaultOptions.workerSrc = () => pdfDefaultOptions.assetsFolder + this.pdfVersion;
    this.appIsReady = true;
    this.isLoading = true;
    this.progressCount = 0;
    this.pdfSrc = pdfSrc;
    this.handlePDF(pdfSrc);
  }

  @Output() pdfLoaded = new EventEmitter<boolean>();
  @Output() pdfLoadFailed = new EventEmitter<Error>();
  @Output() pageChange = new EventEmitter<any>();
  @Output() pdfDownloaded = new EventEmitter<PdfDownloadedEvent>();
  @Output() closed = new EventEmitter<boolean>();


  @HostListener('document:keydown', ['$event'])
  handleHotKey(event: KeyboardEvent): void {
    if (event.key === Keyevents.ESC) {
      this.close();
    }
  }

  constructor() {
    pdfDefaultOptions.assetsFolder = this.deployTarget;
    pdfDefaultOptions.workerSrc = () => pdfDefaultOptions.assetsFolder + this.pdfVersion;
  }

  ngOnInit() {
    window.addEventListener(WcLadonPdfviewerEvents.LadonPdfViewerRefreshEvent, this.refreshFromEvent.bind(this));
  }

  ngOnDestroy() {
    window.removeEventListener(WcLadonPdfviewerEvents.LadonPdfViewerRefreshEvent, this.refreshFromEvent);
  }

  onEvent(event: string, event$: any): void {
    switch (event) {
      case 'onProgress':
        this.progress = event$;
        this.progressCount = Number.parseFloat(event$.percent).toFixed();
        break;
      case 'pageChange':
        this.pageChange.next(event$);
        break;
      case 'pdfLoaded':
        this.isLoading = false;
        this.pdfLoaded.next(true);
        break;
      case 'pdfLoadingFailed':
        this.isLoading = false;
        this.pdfLoadFailed.next(event$);
        break;
      case 'pdfDownloaded':
        this.pdfDownloaded.next(event$);
        break;
    }
  }

  close(): void {
    this.pdfurl = null;
    this.closed.emit(true);
  }

  private handlePDF(pdfSrc: string): void {
    try {
      const bucket = pdfSrc.split('/')[1];
      if (pdfSrc && bucket) {
        this.pdfurl = `${this.path}/${encodeURIComponent(bucket)}/direct?id=${encodeURIComponent(pdfSrc)}${""}`
      } else {
        this.error = true;
      }
    } catch (e) {
      console.error(e)
      this.error = true;
    }
  }

  public reloadPDF(): void {
    this.pdfurl = null;
    setTimeout(
        () => this.handlePDF(this.pdfSrc)
    ), 0
  }

  private refreshFromEvent($event: Event) {
    this.reloadPDF();
  }
}

enum Keyevents {
  ESC = 'Escape'
}

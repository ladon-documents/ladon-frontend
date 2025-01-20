import {Component, effect, ElementRef, OnInit, ViewChild} from '@angular/core';
import {IPDFViewerApplication, PDFNotificationService} from 'ngx-extended-pdf-viewer';

@Component({
  standalone: true,
  selector: 'app-ladon-pdf-paging',
  templateUrl: './ladon-pdf-paging.component.html',
  styleUrls: ['./ladon-pdf-paging.component.scss']
})
export class LadonPdfPagingComponent {
  public disableLastPage = true;
  public disableFirstPage = true;

  @ViewChild('lastPageBtn')
  private buttonLast?: ElementRef<HTMLButtonElement>;

  @ViewChild('firstPageBtn')
  private buttonFirst?: ElementRef<HTMLButtonElement>;

  constructor(private notificationService: PDFNotificationService) {
    effect(() => {
      const vlv = this.notificationService.onPDFJSInitSignal();
      console.log(vlv);
      if (vlv) {
       // this.onPdfJsInit();
      }
    });
  }

  public firstPage(): void {
    const PDFViewerApplication: IPDFViewerApplication = (window as any).PDFViewerApplication;
    PDFViewerApplication.eventBus.dispatch('firstpage');
  }

  public onPdfJsInit(): void {
    const PDFViewerApplication: IPDFViewerApplication = (window as any).PDFViewerApplication;
    PDFViewerApplication.eventBus.on('updateuistate', event => this.updateUIState(event));
  }

  public updateUIState(event: any): void {
    this.disableLastPage = event.pageNumber === event.pagesCount;
    this.disableFirstPage = event.pageNumber <= 1;
    if (this.buttonFirst) {
      this.buttonFirst.nativeElement.disabled = this.disableFirstPage;
    }
    if (this.buttonLast) {
      this.buttonLast.nativeElement.disabled = this.disableLastPage;
    }
  }

  public lastPage(): void {
    const PDFViewerApplication: IPDFViewerApplication = (window as any).PDFViewerApplication;
    PDFViewerApplication.eventBus.dispatch('lastpage');
  }
}

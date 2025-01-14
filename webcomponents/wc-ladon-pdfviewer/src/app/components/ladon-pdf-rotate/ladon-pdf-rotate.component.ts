import {Component, effect, ElementRef, OnInit, ViewChild} from '@angular/core';
import {IPDFViewerApplication, PDFNotificationService} from 'ngx-extended-pdf-viewer';
import {UpdateUIStateEvent} from 'ngx-extended-pdf-viewer/lib/events/update-ui-state-event';

@Component({
  standalone:true,
  selector: 'app-ladon-pdf-rotate',
  templateUrl: './ladon-pdf-rotate.component.html',
  styleUrls: ['./ladon-pdf-rotate.component.scss']
})
export class LadonPdfRotateComponent implements OnInit {
  public disableRotate = true;

  @ViewChild('button1')
  private button1?: ElementRef<HTMLButtonElement>;

  @ViewChild('button2')
  private button2?: ElementRef<HTMLButtonElement>;

  constructor(private notificationService: PDFNotificationService) {
    effect(() => {
      this.notificationService.onPDFJSInitSignal();
    //  this.onPdfJsInit();
    });
  }

  ngOnInit(): void {
  }

  public rotateCW(): void {
    const PDFViewerApplication: IPDFViewerApplication = (window as any).PDFViewerApplication;
    PDFViewerApplication.eventBus.dispatch('rotatecw');
  }

  public rotateCCW(): void {
    const PDFViewerApplication: IPDFViewerApplication = (window as any).PDFViewerApplication;
    PDFViewerApplication.eventBus.dispatch('rotateccw');
  }


  public onPdfJsInit(): void {
    const PDFViewerApplication: IPDFViewerApplication = (window as any).PDFViewerApplication;
    PDFViewerApplication.eventBus.on('updateuistate', (event) => this.updateUIState(event));
  }

  public updateUIState(event: UpdateUIStateEvent): void {
    this.disableRotate = event.pagesCount === 0;
    if (this.button1) {
      this.button1.nativeElement.disabled = this.disableRotate;
    }
    if (this.button2) {
      this.button2.nativeElement.disabled = this.disableRotate;
    }
  }
}

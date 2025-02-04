import { Component, HostBinding, Input, isDevMode, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { DocumentService } from './services/document.service';
import p from '../../package.json';
import { LadonDocument } from './ladon-document';
import { FilesizePipe } from './pipes/filesize.pipe';
import { FileiconPipe } from './pipes/fileicon.pipe';

export interface ButtonStateInterface {
  pdf: boolean;
  zip: boolean;
  share: boolean;
  download: boolean;
  reset: boolean;
}

export type ACTION = 'pdf' | 'zip';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FileiconPipe, FilesizePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  @HostBinding('attr.version') componentVersion = p.version;
  public dateFormat = 'dd.MM.yyyy HH:mm:ss';
  public count: number = 0;
  public isLoading$: Observable<boolean>;

  @Input()
  standalone(isStandalone: boolean) {
    this.ds.setMode(isStandalone);
  }

  @Input()
  set filemode(mode: string) {
    this.ds.setFileMode(mode);
  }

  documents$: Observable<Array<LadonDocument>> | undefined;
  documentIds: any = {};

  public notificator$: Observable<boolean> | undefined;
  public selectedItem?: LadonDocument = undefined;
  public buttonStates: ButtonStateInterface = {
    pdf: false,
    zip: false,
    share: false,
    download: false,
    reset: false,
  };

  constructor(private readonly ds: DocumentService) {
    this.isLoading$ = this.ds.isLoading();
  }

  ngOnInit(): void {
    if (isDevMode()) {
      //System.import("@mind/mf-ladon-styles");
    }
    this.documents$ = this.ds.getDocuments().pipe(
      tap((docs) => {
        this.count = docs.length || 0;
        this.handleButtonState();
      }),
    );

    this.notificator$ = this.ds.notificator$;
  }

  select(doc: LadonDocument) {
    this.selectedItem = doc;
  }

  remove(doc: LadonDocument) {
    this.ds.remove(doc);
  }

  action(type: ACTION) {
    this.ds.action(type);
  }

  public reset(): void {
    this.ds.reset();
  }

  allowDrop(ev: any) {
    ev.preventDefault();
  }

  dropHandler(ev: DragEvent) {
    if (!ev) return;
    ev.preventDefault();
    let payload = ev.dataTransfer?.getData('text');
    if (payload) {
      const doc = JSON.parse(payload);
      if (doc) {
        if (doc && Array.isArray(doc)) {
          this.ds.addDocuments(doc);
        } else {
          this.ds.addDocument(doc);
        }
      }
    }
  }

  private handleButtonState() {
    if (this.count > 0) {
      const isPdf = this.ds.isGeneratePDFActivated();
      this.updateButtonState(true);
      this.buttonStates.pdf = isPdf ? true : false;
    } else {
      this.updateButtonState(false);
    }
  }

  private updateButtonState(shouldbeEnabled: boolean) {
    for (const [key, value] of Object.entries(this.buttonStates)) {
      const _key = key as keyof ButtonStateInterface;
      this.buttonStates[_key] = shouldbeEnabled;
    }
  }
}

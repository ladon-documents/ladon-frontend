import { Injectable } from '@angular/core';
import { ACTION } from '../app.component';
import { BehaviorSubject, tap, Subject } from 'rxjs';
import { LadonDocument } from '../ladon-document';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private readonly DOCUMENTS_ADD = 'ladon:clipboard:documents:add';
  private readonly DOCUMENTS_ADDED = 'ladon:clipboard:documents:add:success';
  private readonly DOWNLOAD_ZIP_EVENT_NAME = 'ladon:files:convert:zip:download';
  private readonly STORE_ZIP_EVENT_NAME = 'ladon:files:convert:zip:store';
  private readonly DOWNLOAD_MERGE_PDF_EVENT_NAME = 'ladon:files:convert:pdf:download';
  private readonly STORE_MERGE_PDF_EVENT_NAME = 'ladon:files:convert:pdf:store';

  private actionEvents = {
    pdf: this.DOWNLOAD_MERGE_PDF_EVENT_NAME,
    zip: this.DOWNLOAD_ZIP_EVENT_NAME,
  };

  private sessoinStorageKey = 'ladon-wc-clipboard-data';
  private documents$ = new BehaviorSubject<Array<LadonDocument>>([]);
  public notificator$ = new Subject<boolean>();

  private contentType = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
  };

  private isStandalone: boolean = false;
  private shouldDownload: boolean = true;
  private loading$ = new BehaviorSubject(false);

  constructor() {
    this.initListener();
    this.initFilesCallbackHandler();
  }

  public isLoading() {
    return this.loading$.asObservable();
  }

  public setMode(mode: boolean) {
    this.isStandalone = !!mode;
  }

  public setFileMode(mode: string) {
    this.shouldDownload = mode === 'download' ? true : false;
    this.actionEvents = {
      pdf: this.shouldDownload ? this.DOWNLOAD_MERGE_PDF_EVENT_NAME : this.STORE_MERGE_PDF_EVENT_NAME,
      zip: this.shouldDownload ? this.DOWNLOAD_ZIP_EVENT_NAME : this.STORE_ZIP_EVENT_NAME,
    };
  }

  public actionFucntion = {
    pdf: () => this.generatePdf('pdf'),
    zip: () => this.generateZip('zip'),
  };

  isGeneratePDFActivated(): boolean {
    return this.documents$.getValue().every((doc) => doc.key?.toLowerCase().indexOf('.pdf') !== -1);
  }

  getDocuments() {
    return this.documents$.asObservable().pipe(
      tap((docs) => {
        this.storeToSessionStorage();
        const event = new CustomEvent(this.DOCUMENTS_ADDED, { detail: docs.length });
        window.dispatchEvent(event);
      }),
    );
  }

  addDocument(doc: LadonDocument) {
    if (!this.checkIsInCollection(doc)) {
      this.documents$.next(this.documents$.getValue().concat([doc]));
    } else {
      alert(`Datei befindet sich ${doc.name} bereits in der Auswahl`);
    }
  }

  addDocuments(docs: Array<LadonDocument>) {
    if (docs && Array.isArray(docs)) {
      for (const doc of docs) {
        if (!this.checkIsInCollection(doc)) {
          this.documents$.next(this.documents$.getValue().concat([doc]));
        }
      }
    }
  }

  remove(document: LadonDocument) {
    const documents = this.documents$.getValue();
    let foundDocumentIndex = -1;
    for (let i = 0; i < documents.length; i++) {
      if (documents[i].path === document.path) {
        foundDocumentIndex = i;
        break;
      }
    }
    if (foundDocumentIndex > -1) {
      documents.splice(foundDocumentIndex, 1);
      this.documents$.next(documents);
    }
  }

  reset() {
    this.documents$.next([]);
    window.sessionStorage.removeItem(this.sessoinStorageKey);
  }

  action(type: ACTION) {
    this.actionFucntion[type]();
  }

  generatePdf(type: ACTION) {
    this.createEvent(type);
  }

  generateZip(type: ACTION) {
    this.createEvent(type);
  }

  private createEvent(type: ACTION) {
    const eventName = this.actionEvents[type];
    if (eventName) {
      try {
        const documentList = this.documents$.getValue();
        if (documentList && Array.isArray(documentList)) {
          const documentKeys = documentList.map((doc) => {
            return doc.path;
          });
          const data = JSON.stringify(documentKeys);
          const event = new CustomEvent(eventName, { detail: data });
          window.dispatchEvent(event);
          this.loading$.next(true);
        }
        return undefined;
      } catch (e) {
        return undefined;
      }
    }
    return undefined;
  }

  private storeToSessionStorage() {
    try {
      window.sessionStorage.removeItem(this.sessoinStorageKey);
      window.sessionStorage.setItem(this.sessoinStorageKey, JSON.stringify(this.documents$.getValue()));
    } catch (e) {
      console.warn('clipboard could not store to Session storage');
    }
  }

  private checkIsInCollection(document: LadonDocument): boolean {
    const documents = this.documents$.getValue();
    let isInCollection = false;
    for (let i = 0; i < documents.length; i++) {
      if (documents[i].path === document.path) {
        isInCollection = true;
        break;
      }
    }
    return isInCollection;
  }

  private initListener() {
    const f = this.getDocumentsFromEvent.bind(this);
    window.addEventListener(this.DOCUMENTS_ADD, f);
  }

  private getDocumentsFromEvent(event: any): void {
    if (event && event.detail)
      try {
        const documents = JSON.parse(event.detail);
        if (documents && Array.isArray(documents)) {
          const isLadonDoc = documents.every((doc: LadonDocument) => {
            return doc.key && doc.path && doc.bucket && doc.name;
          });
          if (isLadonDoc) {
            this.addDocuments(documents);
          }
        }
      } catch (e) {
        console.warn('Clipboard not recieved a stringified list of LadonDocuments, cannot parse');
      }
  }

  private initFilesCallbackHandler() {
    window.addEventListener('ladon:files:convert:success', (event: any) => {
      this.loading$.next(false);
      this.reset();
    });

    window.addEventListener('ladon:files:convert:error', (event: any) => {
      this.loading$.next(false);
      this.notificator$.next(true);
      setTimeout(() => {
        this.notificator$.next(false);
      }, 8000);
    });
  }
}

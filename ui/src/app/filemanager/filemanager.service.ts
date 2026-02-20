import { Injectable } from '@angular/core';
import { DocumentModel, DocumentsService } from '@ladon/api';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FilemanagerService {
  constructor(private documentsService: DocumentsService) {}

  public loadBucket(bucket: string, limit: number = 25) {
    return this.documentsService.listDocuments(bucket, limit, undefined, undefined, undefined, undefined, true);
  }
  public getDocument(document: DocumentModel) {
    const { bucket, key } = document;
    if (bucket && key) {
      return this.documentsService.getDocument(bucket, key);
    }
    return throwError(new Error('Not Found'));
  }

  public saveDocument(document: DocumentModel, content: Blob) {
    const { bucket, key } = document;
    if (bucket && key) {
      return this.documentsService.putDocument(bucket, key, undefined, content);
    }
    return throwError(new Error('Not Found'));
  }

  public deleteDocument(document: DocumentModel) {
    const { bucket, key } = document;
    if (bucket && key) {
      return this.documentsService.deleteDocument(bucket, key);
    }
    return throwError(new Error('Not Found'));
  }

  public loadDocumentList(document: DocumentModel, limit: number = 1000) {
    if (document && document.bucket) {
      return this.documentsService.listDocuments(
        document.bucket,
        limit,
        undefined,
        document.key,
        undefined,
        undefined,
        true,
      );
    }
    return throwError(new Error('Not Found'));
  }

  public getStats(bucketId: string) {
    return this.documentsService.getDocument('_proc', `bucket-stats/${bucketId}/stats.json`);
  }

  public createNewFile(bucket: string, key: string, content: any) {
    return this.documentsService.putDocument(bucket, key);
  }

  public createNewFolder(bucket: string, key: string) {
    return this.documentsService.putFolder(bucket, key);
  }
}

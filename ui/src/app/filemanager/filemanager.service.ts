import { Injectable } from '@angular/core';
import { DocumentModel, DocumentsService, ZipUploadRequestModel } from '../../api';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FilemanagerService {
  constructor(private documentsService: DocumentsService) {}

  public loadBucket(bucket: string) {
    return this.documentsService.listDocuments(bucket, undefined, undefined, undefined, undefined, undefined, true);
  }
  public getDocument(document: DocumentModel) {
    const { bucket, key } = document;
    if (bucket && key) {
      return this.documentsService.getDocument(bucket, key);
    }
    return throwError(new Error('Not Found'));
  }

  public saveDocument(document: DocumentModel, content: any) {
    const { bucket, key } = document;
    const zipUploadRequestModel: ZipUploadRequestModel = {
      content,
    };
    if (bucket && key) {
      return this.documentsService.putDocument(bucket, key, undefined, zipUploadRequestModel);
    }
    return throwError(new Error('Not Found'));
  }

  public loadDocumentList(document: DocumentModel) {
    if (document && document.bucket) {
      return this.documentsService.listDocuments(
        document.bucket,
        undefined,
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

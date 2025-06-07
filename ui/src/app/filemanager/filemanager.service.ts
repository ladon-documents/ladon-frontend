import { Injectable } from '@angular/core';
import { DocumentModel, DocumentsService } from '../../api';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FilemanagerService {
  constructor(private documentsService: DocumentsService) {}

  public loadBucket(bucket: string) {
    return this.documentsService.listDocuments(bucket, undefined, undefined, undefined, undefined, undefined, true);
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
        false,
      );
    }
    return throwError(new Error('Not Found'));
  }

  public getStats(bucketId: string) {
    return this.documentsService.getDocument('_proc', `bucket-stats/${bucketId}/stats.json`);
  }
}

import { Injectable } from '@angular/core';
import { Document } from '@ladon/api';
import { throwError } from 'rxjs';
import { FetchApiFactory } from '../services/api/fetch-api.factory';

@Injectable({
  providedIn: 'root',
})
export class FilemanagerService {
  constructor(private apiFactory: FetchApiFactory) {}

  public loadBucket(bucket: string, limit: number = 25) {
    return this.apiFactory.fromApi(
      () =>
        this.apiFactory.documentsApi.listDocuments({
          bucket,
          limit,
          currentFolder: true,
        }) as Promise<Document[]>,
    );
  }

  public getDocument(document: Document) {
    const { bucket, key } = document;
    if (bucket && key) {
      return this.apiFactory.fromApi(() =>
        this.apiFactory.documentsApi.getDocument({
          bucket,
          key,
        }),
      );
    }
    return throwError(new Error('Not Found'));
  }

  public saveDocument(document: Document, content: Blob) {
    const { bucket, key } = document;
    if (bucket && key) {
      return this.apiFactory.fromApi(
        () =>
          this.apiFactory.documentsApi.putDocument(
            {
              bucket,
              key,
            },
            {
              body: content,
            },
          ) as Promise<Document>,
      );
    }
    return throwError(new Error('Not Found'));
  }

  public deleteDocument(document: Document) {
    const { bucket, key } = document;
    if (bucket && key) {
      return this.apiFactory.fromApi(() =>
        this.apiFactory.documentsApi.deleteDocument({
          bucket,
          key,
        }),
      );
    }
    return throwError(new Error('Not Found'));
  }

  public moveDocument(document: Document, targetBucket: string, targetKey: string) {
    const { bucket, key } = document;
    if (bucket && key && targetBucket && targetKey) {
      return this.apiFactory.fromApi(
        () =>
          this.apiFactory.documentsApi.moveDocument({
            bucket,
            key,
            targetBucket,
            targetKey,
          }) as Promise<Document>,
      );
    }
    return throwError(new Error('Not Found'));
  }

  public copyDocument(document: Document, targetBucket: string, targetKey: string) {
    const { bucket, key } = document;
    if (bucket && key && targetBucket && targetKey) {
      return this.apiFactory.fromApi(
        () =>
          this.apiFactory.documentsApi.copyDocument({
            bucket,
            key,
            targetBucket,
            targetKey,
          }) as Promise<Document>,
      );
    }
    return throwError(new Error('Not Found'));
  }

  public loadDocumentList(document: Document, limit: number = 1000) {
    if (document && document.bucket) {
      const bucket = document.bucket;
      return this.apiFactory.fromApi(
        () =>
          this.apiFactory.documentsApi.listDocuments({
            bucket,
            limit,
            prefix: document.key,
            currentFolder: true,
          }) as Promise<Document[]>,
      );
    }
    return throwError(new Error('Not Found'));
  }

  public getStats(bucketId: string) {
    return this.apiFactory.fromApi(() =>
      this.apiFactory.documentsApi.getDocument({
        bucket: '_proc',
        key: `bucket-stats/${bucketId}/stats.json`,
      }),
    );
  }

  public createNewFile(bucket: string, key: string, content: any | null) {
    return this.apiFactory.fromApi(
      () =>
        this.apiFactory.documentsApi.putDocument({
          bucket,
          key,
          zipUploadRequest: content,
        }) as Promise<Document>,
    );
  }

  public createNewFolder(bucket: string, key: string) {
    return this.apiFactory.fromApi(
      () =>
        this.apiFactory.documentsApi.putFolder({
          bucket,
          key,
        }) as Promise<Document>,
    );
  }
}

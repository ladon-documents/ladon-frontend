import { TestBed } from '@angular/core/testing';
import { Document } from '@ladon/api';
import { firstValueFrom, from } from 'rxjs';
import { FetchApiFactory } from '../services/api/fetch-api.factory';

import { FilemanagerService } from './filemanager.service';

describe('FilemanagerService', () => {
  let service: FilemanagerService;
  let documentsApi: jasmine.SpyObj<{
    putDocument: (request: unknown, initOverrides?: RequestInit) => Promise<Document>;
  }>;

  beforeEach(() => {
    documentsApi = jasmine.createSpyObj('documentsApi', ['putDocument']);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: FetchApiFactory,
          useValue: {
            documentsApi,
            fromApi: <T>(request: () => Promise<T>) => from(request()),
          },
        },
      ],
    });
    service = TestBed.inject(FilemanagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('saves document editor content as the raw blob request body', async () => {
    const document: Document = { bucket: 'bucket-a', key: 'config.json' };
    const content = new Blob(['{"enabled":true}'], { type: 'application/json' });
    const savedDocument: Document = { ...document, contentType: 'application/json' };
    documentsApi.putDocument.and.resolveTo(savedDocument);

    const result = await firstValueFrom(service.saveDocument(document, content));

    expect(result).toBe(savedDocument);
    expect(documentsApi.putDocument).toHaveBeenCalledOnceWith(
      {
        bucket: 'bucket-a',
        key: 'config.json',
      },
      {
        body: content,
      },
    );
  });
});

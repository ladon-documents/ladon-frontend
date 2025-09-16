import { inject, Injectable } from '@angular/core';
import { ConverterInfoModel, ConverterService as ConverterServiceApi, DocumentModel } from '../../api';
import { lastValueFrom } from 'rxjs';
import { ConverterJob } from '../../../../api/fetch-client';

@Injectable({
  providedIn: 'root',
})
export class ConverterService {
  private readonly converterApi = inject(ConverterServiceApi);
  private converters: ConverterInfoModel[] = [];
  private readonly zip = 'mind/zip';
  private readonly unzip = 'mind/unzip';
  private readonly zipenc = 'mind/zip-enc';
  private readonly pdfmerge = 'mind/merge-pdf';
  private readonly watermwark = 'mind/watermark-pdf';
  private readonly preview = 'mind/preview';

  constructor() {}

  public async getPreview(document: DocumentModel) {
    if (!document.path) return null;
    const data: ConverterJob = {
      inputPaths: [document.path],
      converters: [
        {
          id: this.preview,
          config: {},
        },
      ],
    };
    const result = await lastValueFrom(this.converterApi.applyAndDownload(data));
    if (result) {
      return URL.createObjectURL(new Blob([result]));
    }
    return null;
  }

  private async getAvailableConverters() {
    const response = await lastValueFrom(this.converterApi.listConverterInfo());
    this.converters = response;
  }
}

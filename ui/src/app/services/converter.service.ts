import { inject, Injectable } from '@angular/core';
import { ConverterInfoModel, ConverterJobModel, DocumentModel } from '@ladon/api';
import { FetchApiFactory } from './api/fetch-api.factory';

type converterType = 'applyandstore' | 'applyanddownload';

@Injectable({
  providedIn: 'root',
})
export class ConverterService {
  private readonly apiFactory = inject(FetchApiFactory);
  private converters: ConverterInfoModel[] = [];
  private readonly zip = 'mind/zip';
  private readonly unzip = 'mind/unzip';
  private readonly zipenc = 'mind/zip-enc';
  private readonly pdfmerge = 'mind/merge-pdf';
  private readonly watermwark = 'mind/watermark-pdf';
  private readonly preview = 'mind/preview';

  constructor() {
    this.getAvailableConverters();
  }

  public async downloadAsZip(files: string) {
    if (this.converters.length === 0) {
      await this.getAvailableConverters();
    }
    if (this.checkConverterIsAvailable(this.zip)) {
      const payload: any = {
        inputPaths: JSON.parse(files),
        type: 'applyanddownload',
        converterId: this.zip,
      };
      await this.handleConverter(payload.inputPaths, payload.converterId, payload.type);
    }
  }

  public async mergePdf(files: any) {
    if (this.checkConverterIsAvailable(this.pdfmerge)) {
      const payload: any = {
        inputPaths: JSON.parse(files),
        type: 'applyanddownload',
        converterId: this.pdfmerge,
      };
      await this.handleConverter(payload.inputPaths, payload.converterId, payload.type);
    }
  }

  public async getPreview(document: DocumentModel) {
    if (!document.path) return null;
    const data: ConverterJobModel = {
      inputPaths: [document.path],
      converters: [
        {
          id: this.preview,
          config: {},
        },
      ],
    };
    const result = await this.apiFactory.converterApi.applyAndDownload({ converterJob: data as any });
    if (result) {
      return URL.createObjectURL(new Blob([result]));
    }
    return null;
  }

  private async getAvailableConverters() {
    const response = await this.apiFactory.converterApi.listConverterInfo();
    this.converters = response;
  }

  private checkConverterIsAvailable(converterId: string) {
    return this.converters.find((converter) => converter.id === converterId);
  }

  private async handleConverter(inputPaths: Array<string>, converterId: string, type: converterType) {
    const data: ConverterJobModel = {
      inputPaths,
      converters: [
        {
          id: converterId,
          config: {
            prop: 'empty',
          },
        },
      ],
    };
    if (converterId === this.zipenc) {
      // data.converters[0].config['password'] = generateOTP();
      // data.converters[0].config['filename'] = "/_download/" +generateFilename(10) + ".zip";
    }

    if (type === 'applyanddownload') {
      try {
        const response = await this.apiFactory.converterApi.applyAndDownloadRaw({ converterJob: data as any });
        const body = await response.value();
        if (response && body) {
          const fileName = this.getFileName(response);
          console.log(`Filename: ${fileName}`);
          const blob = URL.createObjectURL(new Blob([body]));
          this.downloadURI(blob, fileName);
        }
      } catch (e) {
        // TODO: dispatch error event
      }
    } else {
      try {
        const result = await this.apiFactory.converterApi.applyConverterAndStore({ converterJob: data as any });
        if (result && converterId !== this.zipenc) {
          const url = Array.isArray(result) ? result[0] : result;
          // TODO: dispatch success event with zip file url
          const id = url.slice(url.lastIndexOf('/') + 1);
          const directUrl = this.getDirectLink('_tmp', id);
          window.open(directUrl);
        } else if (result && converterId === this.zipenc) {
          const url = Array.isArray(result) ? result[0] : result;
          // TODO: dispatch success event with zip file url
        }
      } catch (e) {
        // this.errorDispatcher[converterId] && this.errorDispatcher[converterId](type, e);
      }
    }
  }

  private downloadURI(blob: string, filename: string) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = blob;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  private getFileName(response: { raw: Response }): string {
    const contentDisposition = response.raw.headers.get('content-disposition');
    let filename = 'filename';

    if (contentDisposition) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(contentDisposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    }
    return filename;
  }

  private getDirectLink(bucket: string, id: string) {
    return '/admin/api/filemanager/' + bucket + '/' + `direct?id=${encodeURIComponent(id)}&download=true`;
  }
}

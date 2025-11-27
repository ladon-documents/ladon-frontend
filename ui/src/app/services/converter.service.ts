import { inject, Injectable } from '@angular/core';
import { ConverterInfoModel, ConverterService as ConverterServiceApi, DocumentModel } from '../../api';
import { lastValueFrom } from 'rxjs';
import { ConverterJob } from '../../../../api/fetch-client';

type converterType = "applyandstore" | "applyanddownload"

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

  constructor() {
    this.getAvailableConverters();
  }


  public async downloadAsZip(file: string) {

    // document path
    /*
         if (documentList && Array.isArray(documentList)) {
          const documentKeys = documentList.map((doc) => {
            return doc.path;
          });
          const data = JSON.stringify(documentKeys);
          const event = new CustomEvent(eventName, { detail: data });
          window.dispatchEvent(event);
          this.loading$.next(true);
        }
     */

    if (this.converters.length === 0) {
      await this.getAvailableConverters();
    }
    if (this.checkConverterIsAvailable(this.zip)) {
      const payload: any = {
        inputPaths: [file], //JSON.parse(files),
        type: "applyandstore",
        converterId: this.zip
      }
      await this.handleConverter(payload.inputPaths, payload.converterId, payload.type);

    }
  }

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

  private checkConverterIsAvailable(converterId: string) {
    return this.converters.find((converter) => converter.id === converterId);
  }

  private getFileName(result: any): string {
    let filename;
    if (result.headers["content-disposition"] && result.headers["content-disposition"].startsWith("attachment")) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(result.headers["content-disposition"]);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, "");
      }
    }
    return filename ?? 'filename';
  }

  private async handleConverter(inputPaths: Array<string>, converterId: string, type: converterType) {
    const data: ConverterJob = {
      inputPaths,
      converters: [
        {
          id: converterId,
          config: {
            'flatten': "true"
          }
        }]
    };
    if (converterId === this.zipenc) {
      // data.converters[0].config['password'] = generateOTP();
      // data.converters[0].config['filename'] = "/_download/" +generateFilename(10) + ".zip";
    }

    if (type === "applyanddownload") {
      try {
        const result = await lastValueFrom(this.converterApi.applyAndDownload(data));
        if (result) {
          const fileName = this.getFileName(result);
          const blob = URL.createObjectURL(new Blob([result]));
          this.downloadURI(blob, fileName);
        }
      } catch (e) {
        // this.errorDispatcher[converterId] && this.errorDispatcher[converterId](type, e);
      }
    } else {
      try {
        const result = await lastValueFrom(this.converterApi.applyConverterAndStore(data));
        if (result && converterId !== this.zipenc) {
          const url = Array.isArray(result) ? result[0] : result;
          // this.successDispatcher[converterId] && this.successDispatcher[converterId](type, url);
          const id = url.slice(url.lastIndexOf("/") + 1);
          const directUrl = this.getDirectLink("_tmp", id);
          window.open(directUrl);
        } else if (result && converterId === this.zipenc) {
          const url = Array.isArray(result) ? result[0] : result;
          //this.successDispatcher[converterId] && this.successDispatcher[converterId](type, url);
          // const _url = (window.location.host) + '/dl/' + filename;
          //const dialogManager = new DialogManager(_url, otp);
          //dialogManager.openDialog();
        }
      } catch (e) {
        // this.errorDispatcher[converterId] && this.errorDispatcher[converterId](type, e);
      }
    }

  }

  private downloadURI(blob: string, filename: string) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = blob;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  private getDirectLink(bucket: string, id: string) {
    return (
      "/admin/api/filemanager/" + bucket + "/" + `direct?id=${encodeURIComponent(id)}&download=true`
    );
  }

}

import { devLog } from '../shared/util/dev-log';
import { inject, Injectable } from '@angular/core';
import { ConverterInfo, ConverterJob, Document } from '@ladon/api';
import { FetchApiFactory } from './api/fetch-api.factory';
import { ToastService } from '../shared/services/toast.service';

type converterType = 'applyandstore' | 'applyanddownload';

@Injectable({
  providedIn: 'root',
})
export class ConverterService {
  private readonly apiFactory = inject(FetchApiFactory);
  private readonly toastService = inject(ToastService);
  private converters: ConverterInfo[] = [];
  private readonly zip = 'mind/zip';
  private readonly unzip = 'mind/unzip';
  private readonly zipenc = 'mind/zip-enc';
  private readonly pdfmerge = 'mind/merge-pdf';
  private readonly watermwark = 'mind/watermark-pdf';
  private readonly preview = 'mind/preview';

  constructor() {
    this.getAvailableConverters();
  }

  public async downloadAsZip(files: string | string[]) {
    if (this.converters.length === 0) {
      await this.getAvailableConverters();
    }
    const inputPaths = this.normalizeInputPaths(files);
    if (inputPaths.length === 0) {
      this.toastService.error('Zip: keine gültigen Dokumente zum komprimieren');
      return;
    }
    if (this.checkConverterIsAvailable(this.zip)) {
      await this.handleConverter(inputPaths, this.zip, 'applyanddownload');
    }
  }

  public async mergePdf(files: string | string[]) {
    if (this.checkConverterIsAvailable(this.pdfmerge)) {
      const inputPaths = this.normalizeInputPaths(files);
      if (inputPaths.length === 0) {
        this.toastService.error('PDF-Merge: keine gültigen Dokumente');
        return;
      }
      await this.handleConverter(inputPaths, this.pdfmerge, 'applyanddownload');
    }
  }

  /**
   * Normalisiert die Converter-Input-Zeile(n) zu einer Liste von Pfaden (O7).
   * Bewahrt den bestehenden Vertrag: Aufrufer (Clipboard-Store) übergeben
   * `JSON.stringify(paths)` → wird hier wieder zum Array geparst. Ein roher,
   * nicht-JSON-Key (wie ihn einzelne UI-Aufrufe übergeben) wird als einzelner
   * Pfad behandelt statt `JSON.parse`-Fehler zu werfen (B2).
   */
  private normalizeInputPaths(input: string | string[]): string[] {
    if (Array.isArray(input)) {
      return input.filter((path) => typeof path === 'string' && path.length > 0);
    }

    const trimmed = typeof input === 'string' ? input.trim() : '';
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((path) => typeof path === 'string' && path.length > 0);
      }
    } catch {
      // Kein JSON: roher Einzel-Pfad statt Wurf.
    }

    return [trimmed];
  }

  public async getPreview(document: Document) {
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
    const data: ConverterJob = {
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
          devLog(`Filename: ${fileName}`);
          const blob = URL.createObjectURL(new Blob([body]));
          this.downloadURI(blob, fileName);
        }
      } catch (e) {
        // Echte Fehler sichtbar lassen (nicht stumm wie zuvor via TODO).
        console.error(`Converter "${converterId}" (applyanddownload) fehlgeschlagen:`, e);
        this.toastService.error(`Converter "${converterId}" ist fehlgeschlagen`);
      }
    } else {
      try {
        const result = await this.apiFactory.converterApi.applyConverterAndStore({ converterJob: data as any });
        if (result && converterId !== this.zipenc) {
          const url = Array.isArray(result) ? result[0] : result;
          const id = url.slice(url.lastIndexOf('/') + 1);
          const directUrl = this.getDirectLink('_tmp', id);
          window.open(directUrl);
        } else if (result && converterId === this.zipenc) {
          const url = Array.isArray(result) ? result[0] : result;
          void url;
        }
      } catch (e) {
        console.error(`Converter "${converterId}" (applyandstore) fehlgeschlagen:`, e);
        this.toastService.error(`Converter "${converterId}" ist fehlgeschlagen`);
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

  getDirectLink(bucket: string, id: string) {
    return '/admin/api/filemanager/' + bucket + '/' + `direct?id=${encodeURIComponent(id)}&download=true`;
  }
}

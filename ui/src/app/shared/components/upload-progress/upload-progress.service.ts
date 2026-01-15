// upload-progress.service.ts
import { Injectable, signal, computed } from '@angular/core';

export interface UploadItem {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  message: string;
  startTime?: number;
  speed?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UploadProgressService {
  private readonly _uploads = signal<UploadItem[]>([]);

  readonly uploads = this._uploads.asReadonly();
  readonly hasActiveUploads = computed(() =>
    this._uploads().some(upload => upload.status === 'uploading')
  );
  readonly activeUploadsCount = computed(() =>
    this._uploads().filter(upload => upload.status === 'uploading').length
  );

  addUpload(upload: UploadItem): void {
    this._uploads.update(uploads => [...uploads, upload]);
  }

  updateUpload(fileName: string, updates: Partial<UploadItem>): void {
    this._uploads.update(uploads =>
      uploads.map(upload =>
        upload.fileName === fileName ? { ...upload, ...updates } : upload
      )
    );
  }

  removeUpload(fileName: string): void {
    this._uploads.update(uploads =>
      uploads.filter(upload => upload.fileName !== fileName)
    );
  }

  clearCompleted(): void {
    this._uploads.update(uploads =>
      uploads.filter(upload => upload.status === 'uploading')
    );
  }
}

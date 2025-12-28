import { inject, Injectable, signal } from '@angular/core';
import { FilemanagerService } from '../filemanager.service';
import { FilemanagerFacade } from '../filemanager.facade';


export interface UploadStatus {
  fileName: string;
  status: 'uploading' | 'success' | 'error';
  message: string;
  progress: number;
  startTime: number;
  fileSize?: number;
  uploadedBytes?: number;
  speed?: number; // Bytes pro Sekunde
}


@Injectable({
  providedIn: 'root'
})
export class FilemanagerContentFacade {
  uploadProgress = signal<UploadStatus[]>([]);

  filemanagerService = inject(FilemanagerService);
  filemanagerFacade = inject(FilemanagerFacade);

  constructor() { }

  getUploadAlertClass(status: string): string {
    const baseClasses = 'animate-in slide-in-from-right-4 duration-300';
    switch (status) {
      case 'uploading':
        return `${baseClasses} alert-info border-info/20`;
      case 'success':
        return `${baseClasses} alert-success border-success/20`;
      case 'error':
        return `${baseClasses} alert-error border-error/20`;
      default:
        return baseClasses;
    }
  }

  getStatusTextClass(status: string): string {
    switch (status) {
      case 'uploading':
        return 'text-info';
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-error';
      default:
        return 'opacity-70';
    }
  }

  getFileSize(fileName: string): string {
    // Hier könnten Sie die Dateigröße aus dem File-Objekt holen
    // Für Demo-Zwecke ein Placeholder
    return '2.5 MB';
  }

  getUploadSpeed(upload: UploadStatus): string {
    if (upload.speed) {
      if (upload.speed > 1024 * 1024) {
        return `${(upload.speed / (1024 * 1024)).toFixed(1)} MB/s`;
      } else if (upload.speed > 1024) {
        return `${(upload.speed / 1024).toFixed(1)} KB/s`;
      } else {
        return `${upload.speed.toFixed(0)} B/s`;
      }
    }
    return '';
  }

  getRemainingTime(upload: UploadStatus): string {
    if (upload.speed && upload.fileSize) {
      const remainingBytes = upload.fileSize - (upload.uploadedBytes || 0);
      const remainingSeconds = remainingBytes / upload.speed;

      if (remainingSeconds > 60) {
        const minutes = Math.ceil(remainingSeconds / 60);
        return `${minutes} Min verbleibend`;
      } else {
        return `${Math.ceil(remainingSeconds)} Sek verbleibend`;
      }
    }
    return '';
  }

  removeUpload(upload: UploadStatus): void {
    this.uploadProgress.update(current =>
      current.filter(u => u !== upload)
    );
  }

  hasActiveUploads(): boolean {
    return this.uploadProgress().some(upload => upload.status === 'uploading');
  }

  getActiveUploadsCount(): number {
    return this.uploadProgress().filter(upload => upload.status === 'uploading').length;
  }

  getTotalProgress(): number {
    const activeUploads = this.uploadProgress().filter(upload => upload.status === 'uploading');
    if (activeUploads.length === 0) return 100;

    const totalProgress = activeUploads.reduce((sum, upload) => sum + upload.progress, 0);
    return totalProgress / activeUploads.length;
  }

  getTotalUploadSpeed(): string {
    const activeUploads = this.uploadProgress().filter(upload => upload.status === 'uploading');
    const totalSpeed = activeUploads.reduce((sum, upload) => sum + (upload.speed || 0), 0);

    if (totalSpeed > 1024 * 1024) {
      return `${(totalSpeed / (1024 * 1024)).toFixed(1)} MB/s`;
    } else if (totalSpeed > 1024) {
      return `${(totalSpeed / 1024).toFixed(1)} KB/s`;
    } else {
      return `${totalSpeed.toFixed(0)} B/s`;
    }
  }



  async uploadFile(file: File): Promise<void> {
    const uploadStatus: UploadStatus = {
      fileName: file.name,
      status: 'uploading',
      message: 'Upload wird vorbereitet...',
      progress: 0,
      startTime: Date.now(),
      fileSize: file.size,
      uploadedBytes: 0,
      speed: 0
    };

    this.uploadProgress.update(current => [...current, uploadStatus]);

    try {
      const currentPath = this.getCurrentPath();
      const bucket = this.filemanagerFacade.selectedBucket();
      const fileKey = currentPath ? `${currentPath}/${file.name}` : file.name;

      await this.uploadWithProgress(bucket as string, file.name, file, uploadStatus);

      uploadStatus.status = 'success';
      uploadStatus.message = 'Upload erfolgreich abgeschlossen';
      uploadStatus.progress = 100;

      this.refreshFileList();

      // Success-Status nach 3 Sekunden automatisch entfernen
      setTimeout(() => {
        this.removeUpload(uploadStatus);
      }, 1500);

    } catch (error) {
      console.error('Upload failed:', error);
      uploadStatus.status = 'error';
      uploadStatus.message = 'Upload fehlgeschlagen - Bitte versuchen Sie es erneut';
    }
  }

  private async uploadWithProgress(
    bucket: string,
    fileName: string,
    file: File,
    uploadStatus: UploadStatus
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const startTime = Date.now();

      const interval = setInterval(() => {
        const previousProgress = progress;
        progress += Math.random() * 12 + 3; // Zwischen 3-15% pro Update

        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          const document = {
            bucket,
            key: fileName,
          }

          // Hier würden Sie den echten Upload durchführen
          this.filemanagerService.saveDocument(document, file)
            .subscribe({
              next: () => resolve(),
              error: (error) => reject(error)
            });


        // Finaler Upload-Call
          setTimeout(() => resolve(), 500);
        }

        // Progress und Speed berechnen
        const currentTime = Date.now();
        const elapsedTime = (currentTime - startTime) / 1000; // in Sekunden
        const progressDelta = progress - previousProgress;
        const bytesDelta = (file.size * progressDelta) / 100;

        uploadStatus.progress = Math.min(progress, 99);
        uploadStatus.uploadedBytes = (file.size * uploadStatus.progress) / 100;
        uploadStatus.speed = elapsedTime > 0 ? uploadStatus.uploadedBytes / elapsedTime : 0;

        // Status-Nachricht aktualisieren
        if (uploadStatus.progress < 50) {
          uploadStatus.message = 'Upload läuft...';
        } else if (uploadStatus.progress < 90) {
          uploadStatus.message = 'Upload fast abgeschlossen...';
        } else {
          uploadStatus.message = 'Upload wird finalisiert...';
        }

      }, 300);
    });
  }



  showErrorToast(message: string): void {
    // Implementieren Sie Toast-Benachrichtigungen
    console.error(message);
    // Optional: Integration mit einem Toast-Service
  }


  private getCurrentPath(): string {
    // Implementieren Sie diese Methode basierend auf Ihrer Router-Logik
    // Beispiel: return this.router.url.split('/').slice(2).join('/');
    return ''; // Placeholder
  }

  private refreshFileList(): void {
    this.filemanagerFacade.reloadBucket()
  }


}

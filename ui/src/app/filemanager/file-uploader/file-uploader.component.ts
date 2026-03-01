import { Component } from '@angular/core';
import { FileUploadDirective, FileUploadEvent } from '../../shared/directive/file-upload.directive';
import { NgIcon } from '@ng-icons/core';

interface UploadStatus {
  fileName: string;
  status: 'uploading' | 'success' | 'error';
  message: string;
  progress?: number;
}

@Component({
  selector: 'file-uploader',
  imports: [FileUploadDirective, NgIcon],
  templateUrl: './file-uploader.component.html',
  styleUrl: './file-uploader.component.scss',
})
export class FileUploaderComponent {
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif'];
  maxFileSize = 50 * 1024 * 1024; // 50MB
  isHovering = false;
  uploadError: string | null = null;
  uploadProgress = 0;
  uploadStatus: UploadStatus[] = [];

  onFilesDropped(event: FileUploadEvent): void {
    console.log('Files dropped:', event.files);
    this.uploadError = null;

    event.files.forEach((file) => {
      this.uploadFile(file);
    });
  }

  onFilesHovered(isHovering: boolean): void {
    this.isHovering = isHovering;
  }

  onFilesRejected(event: { files: File[]; reasons: string[] }): void {
    console.log('Files rejected:', event);
    this.uploadError = `Dateien abgelehnt: ${event.reasons.join(', ')}`;

    setTimeout(() => {
      this.uploadError = null;
    }, 5000);
  }

  private async uploadFile(file: File): Promise<void> {
    const uploadStatus: UploadStatus = {
      fileName: file.name,
      status: 'uploading',
      message: 'Wird hochgeladen...',
      progress: 0,
    };

    this.uploadStatus.push(uploadStatus);

    try {
      await this.simulateUpload(file, uploadStatus);

      uploadStatus.status = 'success';
      uploadStatus.message = 'Upload erfolgreich';
      // this.#facade.loadStats();
    } catch (error) {
      console.error('Upload failed:', error);
      uploadStatus.status = 'error';
      uploadStatus.message = 'Upload fehlgeschlagen';
    }
    setTimeout(() => {
      const index = this.uploadStatus.findIndex((s) => s === uploadStatus);
      if (index > -1) {
        this.uploadStatus.splice(index, 1);
      }
    }, 5000);
  }

  private simulateUpload(file: File, uploadStatus: UploadStatus): Promise<void> {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          if (Math.random() < 0.1) {
            reject(new Error('Simulated upload error'));
          } else {
            resolve();
          }
        }

        uploadStatus.progress = Math.round(progress);
        this.uploadProgress = progress;
      }, 200);
    });
  }
}

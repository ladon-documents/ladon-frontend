import { Component, inject } from '@angular/core';
import { FilemanagerFacade } from '../filemanager.facade';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'filemanager-meta',
  imports: [CommonModule, DatePipe],
  templateUrl: './meta.component.html',
  styleUrl: './meta.component.scss',
})
export class MetaComponent {
  private readonly filemanagerFacade = inject(FilemanagerFacade);
  selectedDocument = this.filemanagerFacade.selectedDocument;

  getMetadataEntries(metadata: any): Array<{key: string, value: any}> {
    if (!metadata) return [];
    return Object.entries(metadata).map(([key, value]) => ({
      key: key,
      value: value
    }));
  }


// Hilfsfunktion zum Formatieren der Dateigröße
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

}

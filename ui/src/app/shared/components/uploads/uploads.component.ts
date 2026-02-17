import { Component, computed, inject } from '@angular/core';
import { UploadProgressComponent } from '../upload-progress/upload-progress.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroDocumentArrowUp } from '@ng-icons/heroicons/outline';
import { FilemanagerContentFacade } from '../../../filemanager/filemanager-content/filemanager-content.facade';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-uploads',
  imports: [UploadProgressComponent, NgIcon, CommonModule],
  templateUrl: './uploads.component.html',
  providers: [provideIcons({ heroDocumentArrowUp })],
  styleUrl: './uploads.component.scss',
})
export class UploadsComponent {
  protected readonly filemanagerContentFacade = inject(FilemanagerContentFacade);
  hasActiveUploads = computed(() => this.filemanagerContentFacade.hasActiveUploads());
}

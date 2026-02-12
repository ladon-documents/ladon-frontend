import { Component, computed, inject, input } from '@angular/core';
import { SpinnerComponent } from '../spinner/spinner.component';
import { UploadProgressComponent } from '../upload-progress/upload-progress.component';
import { FilemanagerContentFacade } from '../../../filemanager/filemanager-content/filemanager-content.facade';

@Component({
  selector: 'lib-uploads',
  imports: [SpinnerComponent, UploadProgressComponent],
  templateUrl: './uploads.component.html',
  styleUrl: './uploads.component.scss',
})
export class UploadsComponent {
  protected readonly filemanagerContentFacade = inject(FilemanagerContentFacade);

  hasActiveUploads = computed(() => this.filemanagerContentFacade.hasActiveUploads());
  uploads = input<string[]>();
}

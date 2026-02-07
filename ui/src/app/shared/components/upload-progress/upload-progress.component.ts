import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { FilemanagerContentFacade } from '../../../filemanager/filemanager-content/filemanager-content.facade';
import { heroCheckCircle, heroCloudArrowUp, heroXCircle, heroXMark } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'lib-upload-progress',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [provideIcons({ heroCheckCircle, heroXCircle, heroXMark, heroCloudArrowUp })],
  templateUrl: './upload-progress.component.html',
  styles: `
    :host {
      position: absolute;
      right: 0;
    }
  `,
})
export class UploadProgressComponent {
  protected readonly filemanagerContentFacade = inject(FilemanagerContentFacade);
  protected readonly Math = Math;
  protected readonly uploadProgress = this.filemanagerContentFacade.uploadProgress;
}

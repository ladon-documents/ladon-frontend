import { AfterViewInit, Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { ClipboardService } from './clipboard.service';
import { DocumentModel } from '../../../../api';
import { FileiconPipe } from '../../pipes/fileicon.pipe';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { FilesizePipe } from '../../pipes/filesize.pipe';
import { ClipboardStore } from '../../../store/clipboard.store';
import {
  heroArchiveBox,
  heroClipboardDocumentList,
  heroDocumentPlus,
  heroDocumentText,
  heroInformationCircle,
  heroTrash,
} from '@ng-icons/heroicons/outline';

interface ButtonStateInterface {
  pdf: boolean;
  zip: boolean;
  share: boolean;
  download: boolean;
  reset: boolean;
}
type ACTION = 'pdf' | 'zip';

@Component({
  selector: 'ladon-clip-board',
  standalone: true,
  imports: [CommonModule, CdkDropList, CdkDrag, FileiconPipe, NgIcon, FilesizePipe],
  providers: [
    provideIcons({
      heroDocumentPlus,
      heroArchiveBox,
      heroDocumentText,
      heroInformationCircle,
      heroClipboardDocumentList,
      heroTrash,
    }),
  ],
  templateUrl: './clipboard.component.html',
  styleUrls: ['./clipboard.component.scss'],
})
export class ClipboardComponent implements AfterViewInit {
  @ViewChild(CdkDropList) dropList!: CdkDropList;
  public buttonStates: ButtonStateInterface = {
    pdf: false,
    zip: false,
    share: false,
    download: false,
    reset: false,
  };
  readonly clipboardStore = inject(ClipboardStore);

  constructor(private clipboardService: ClipboardService) {}
  documents: Array<DocumentModel> = [];

  ngAfterViewInit(): void {
    this.clipboardService.setClipboardList(this.dropList);
  }

  drop(event: CdkDragDrop<DocumentModel[]>) {
    if (event.previousContainer === event.container) {
      this.clipboardStore.reorderDocuments(event.previousIndex, event.currentIndex);
    } else {
      const document = event.previousContainer.data[event.previousIndex];
      this.clipboardStore.addDocument(document);
    }
  }

  remove(doc: DocumentModel): void {
    if (doc.key) {
      this.clipboardStore.removeDocument(doc.key);
    }
  }

  removeByIndex(index: number): void {
    this.clipboardStore.removeDocumentByIndex(index);
  }

  action(type: ACTION): void {
    if (type === 'pdf') {
      this.mergePdfs();
    } else if (type === 'zip') {
      this.createZip();
    }
  }

  mergePdfs(): void {
    if (!this.clipboardStore.canGeneratePdf()) {
      console.warn('PDF-Merge nicht möglich: Nicht alle Dokumente sind PDFs oder weniger als 2 Dokumente');
      return;
    }
    this.clipboardStore.mergePdfs();
  }

  createZip(): void {
    if (!this.clipboardStore.canCreateZip()) {
      console.warn('ZIP-Erstellung nicht möglich: Keine Dokumente ausgewählt');
      return;
    }
    this.clipboardStore.createZip();

  }

  reset(): void {
    this.clipboardStore.clearDocuments();
  }

  dismissError(): void {
    this.clipboardStore.clearError();
  }
}

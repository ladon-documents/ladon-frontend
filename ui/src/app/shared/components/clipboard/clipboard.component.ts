import { Component, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  copyArrayItem,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ClipboardService } from './clipboard.service';
import { DocumentModel } from '../../../../api';
import { FileiconPipe } from '../../pipes/fileicon.pipe';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { FilesizePipe } from '../../pipes/filesize.pipe';
import { ClipboardStore } from '../../../store/clipboard.store';
import {
  heroArchiveBox,
  heroBars3,
  heroBars3BottomLeft,
  heroCalendarDays,
  heroChevronDown,
  heroChevronUp,
  heroClock,
  heroDocumentDuplicate,
  heroDocumentPlus,
  heroDocumentText,
  heroEye,
  heroMagnifyingGlass,
  heroPlus,
  heroScale,
  heroSquares2x2,
  heroXMark,
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

  /*
  drop(event: CdkDragDrop<DocumentModel[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      copyArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
    this.handleButtonState();
  }

   */

  drop(event: CdkDragDrop<DocumentModel[]>) {
    if (event.previousContainer === event.container) {
      // Dokumente innerhalb des Clipboards neu anordnen
      this.clipboardStore.reorderDocuments(event.previousIndex, event.currentIndex);
    } else {
      // Dokument von außen ins Clipboard kopieren
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

  action(type: ACTION) {
    this.clipboardStore.setActionInProgress(true);
  }

  reset(): void {
    this.clipboardStore.clearDocuments();
  }

  private handleButtonState() {
    if (this.documents.length > 0) {
      const isPdf = this.isGeneratePDFActivated();
      this.updateButtonState(true);
      this.buttonStates.pdf = isPdf;
    } else {
      this.updateButtonState(false);
    }
  }

  private updateButtonState(shouldbeEnabled: boolean) {
    for (const [key, value] of Object.entries(this.buttonStates)) {
      const _key = key as keyof ButtonStateInterface;
      this.buttonStates[_key] = shouldbeEnabled;
    }
  }

  private isGeneratePDFActivated(): boolean {
    return this.documents.every((doc) => doc.key?.toLowerCase().indexOf('.pdf') !== -1);
  }
}

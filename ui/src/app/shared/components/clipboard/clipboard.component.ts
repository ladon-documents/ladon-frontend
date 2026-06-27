import { AfterViewInit, Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { ClipboardService } from './clipboard.service';
import { Document } from '@ladon/api';
import { FileiconPipe } from '../../pipes/fileicon.pipe';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { FilesizePipe } from '../../pipes/filesize.pipe';
import { ClipboardStore } from '../../../store/clipboard.store';
import { SelectionStore } from '../../../store/selection.store';
import {
  heroArchiveBox,
  heroBars3,
  heroClipboardDocumentList,
  heroDocumentPlus,
  heroDocumentText,
  heroExclamationTriangle,
  heroInformationCircle,
  heroTrash,
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
      heroInformationCircle,
      heroClipboardDocumentList,
      heroTrash,
      heroBars3,
      heroXMark,
      heroExclamationTriangle,
    }),
  ],
  templateUrl: './clipboard.component.html',
  styleUrls: ['./clipboard.component.scss'],
})
export class ClipboardComponent implements AfterViewInit {
  @ViewChild('clipboardList', { read: CdkDropList }) dropList!: CdkDropList;
  public buttonStates: ButtonStateInterface = {
    pdf: false,
    zip: false,
    share: false,
    download: false,
    reset: false,
  };
  readonly clipboardStore = inject(ClipboardStore);
  readonly selectionStore = inject(SelectionStore);
  protected readonly originList = inject(ClipboardService).originList;

  constructor(private clipboardService: ClipboardService) {}
  documents: Array<Document> = [];

  ngAfterViewInit(): void {
    this.clipboardService.setClipboardList(this.dropList);
  }

  drop(event: CdkDragDrop<Document[]>) {
    if (event.previousContainer === event.container) {
      this.clipboardStore.reorderDocuments(event.previousIndex, event.currentIndex);
    } else {
      const documents = this.resolveDragDocuments(event);
      if (documents.length > 0) {
        this.clipboardStore.addDocuments(documents);
      }
    }
  }

  onItemClick(document: Document, index: number, event: MouseEvent): void {
    if (event.shiftKey) {
      this.selectionStore.selectRange(this.clipboardStore.selectedDocuments(), index);
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      this.selectionStore.toggleSelection(document, index);
      return;
    }

    this.selectionStore.selectSingle(document, index);
  }

  getDragPayload(document: Document): Document[] {
    if (!this.selectionStore.isSelected(document)) {
      return [document];
    }

    const clipboardDocumentIds = new Set(this.clipboardStore.selectedDocuments().map((doc) => this.documentId(doc)));
    const selectedClipboardDocuments = this.selectionStore
      .selectedDocuments()
      .filter((selectedDocument) => clipboardDocumentIds.has(this.documentId(selectedDocument)));

    return selectedClipboardDocuments.length > 1 ? selectedClipboardDocuments : [document];
  }

  remove(doc: Document): void {
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

  private resolveDragDocuments(event: CdkDragDrop<Document[]>): Document[] {
    const dragData = event.item.data;
    if (Array.isArray(dragData)) {
      return dragData;
    }

    const fallbackDocument = event.previousContainer.data[event.previousIndex];
    return fallbackDocument ? [fallbackDocument] : [];
  }

  private documentId(document: Document): string {
    return `${document.bucket || ''}::${document.key || document.path || document.name || ''}`;
  }
}

import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  QueryList,
  signal,
  Signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DocumentModel } from '@ladon/api';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroArrowDownTray,
  heroChevronDown,
  heroChevronUp,
  heroCloudArrowUp,
  heroDocumentDuplicate,
  heroFolder,
  heroInformationCircle,
  heroLink,
  heroPencilSquare,
  heroPhoto,
  heroPlusCircle,
  heroShare,
  heroStar,
  heroTrash,
} from '@ng-icons/heroicons/outline';
import { heroFolderSolid, heroStarSolid } from '@ng-icons/heroicons/solid';
import { FilesizePipe } from '../../shared/pipes/filesize.pipe';
import { FileiconPipe } from '../../shared/pipes/fileicon.pipe';
import { FilemanagerFacade } from '../filemanager.facade';
import { ConverterService } from '../../services/converter.service';
import { FilemanagerPaginationComponent } from '../pagination/pagination.component';
import { filemanagerHelper } from '../helper/helper';
import { FileUploadDirective } from '../../shared/directive/file-upload.directive';
import { FilemanagerContentFacade } from './filemanager-content.facade';
import { ClipboardService } from '../../shared/components/clipboard/clipboard.service';
import { MonacoEditorService } from '../../editor/editor.service';
import { FolderComponent } from '@ladon/shared';
import { SelectionStore } from '../../store/selection.store';
import { FavoritesStore } from '../../store/favorites.store';
import { FilemanagerContextMenuService } from '../filemanager-context-menu.service';
import { MoveOrCopyDialogComponent } from '../../shared/components/move-or-copy-dialog/move-or-copy-dialog.component';
import { InputDialogService } from '../../shared/services/input-dialog.service';
import { isWebComponentRegistered } from '@ladon/utility';
import { FilemanagerWorkspaceService } from '../filemanager-workspace.service';


@Component({
  standalone: true,
  selector: 'app-filemanager-content',
  imports: [
    CommonModule,
    NgIcon,
    FilesizePipe,
    FileiconPipe,
    FilemanagerPaginationComponent,
    FileUploadDirective,
    CdkDrag,
    CdkDropList,
    FolderComponent,
    MoveOrCopyDialogComponent,
  ],
  providers: [
    provideIcons({
      heroFolder,
      heroPlusCircle,
      heroFolderSolid,
      heroPhoto,
      heroStar,
      heroTrash,
      heroPencilSquare,
      heroArrowDownTray,
      heroDocumentDuplicate,
      heroShare,
      heroChevronUp,
      heroChevronDown,
      heroCloudArrowUp,
      heroLink,
      heroInformationCircle,
      heroStarSolid,
    }),
    FilesizePipe,
  ],
  templateUrl: './filemanager-content.component.html',
  styleUrl: './filemanager-content.component.scss',
})
export class FilemanagerContentComponent implements OnInit, AfterViewInit {
  @ViewChildren(CdkDropList) dropLists!: QueryList<CdkDropList>;
  @ViewChild(MoveOrCopyDialogComponent) moveOrCopyDialogVC!: MoveOrCopyDialogComponent;

  public dateFormat = 'dd.MM.yyyy';
  readonly #facade = inject(FilemanagerFacade);
  readonly filemanagerContentFacade = inject(FilemanagerContentFacade);
  private readonly converterService = inject(ConverterService);
  private readonly workspaceService = inject(FilemanagerWorkspaceService);
  readonly filemanagerContextMenuService = inject(FilemanagerContextMenuService);
  readonly selectionStore = inject(SelectionStore);
  readonly favoritesStore = inject(FavoritesStore);
  readonly clipboardService = inject(ClipboardService);
  readonly inputDialogService = inject(InputDialogService);
  readonly monacoEditorService = inject(MonacoEditorService);

  protected readonly clipboardList = this.clipboardService.clipboardList;
  documents: Signal<DocumentModel[]> = this.#facade.documents;

  #currentBucket: string | null = null;
  #subfolder: string | null = null;
  #selectedDocument: DocumentModel | null = null;
  viewMode = this.#facade.viewMode;
  readonly searchTerm = this.#facade.searchTerm;
  readonly sortConfig = this.#facade.sortConfig;

  private readonly imageEditorTagName = 'ladon-image-editor';
  private readonly mediaPlayerTagName = 'ladon-media-player';
  private readonly pdfViewerTagName = 'ladon-pdfviewer';

  isDragOver = signal(false);
  allowedFileTypes: string[] = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png', '.gif', '.yaml', '.yml', '.mp4'];
  maxFileSize = 50 * 1024 * 1024; // 50MB

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.data.subscribe((data) => {
      this.#currentBucket = data['bucket'];
    });

    this.route.params.subscribe((params) => {
      console.log('Bucket:', params['bucket']);
      console.log('Subfolders:', params['subfolders']);
      //    this.#currentBucket = params['bucket'];
      this.#subfolder = params['subfolders'];
      if (this.#currentBucket && !this.#subfolder) {
        //   this.showRoot();
      } else if (this.#currentBucket && this.#subfolder) {
        console.log(this.#subfolder);
      }
    });
  }

  ngAfterViewInit(): void {
    this.updateOriginList();
    this.dropLists.changes.subscribe(() => {
      setTimeout(() => this.updateOriginList(), 0);
    });
  }

  getSelectedDocument(): DocumentModel | null {
    return this.#selectedDocument;
  }

  isSelected(document: DocumentModel): boolean {
    return this.selectionStore.isSelected(document);
  }

  copy(file: DocumentModel) {
    console.log('copy');
  }

  async download(file: string | undefined) {
    if (!file) return;
    await this.converterService.downloadAsZip(file);
  }

  setViewMode(mode: 'card' | 'table') {
    this.#facade.setViewMode(mode);
  }

  // Pagination methods
  goToPage(page: number) {
    this.#facade.goToPage(page);
  }

  nextPage() {
    this.#facade.nextPage();
  }

  previousPage() {
    this.#facade.previousPage();
  }

  firstPage() {
    this.#facade.firstPage();
  }

  lastPage() {
    this.#facade.lastPage();
  }

  setPageSize(pageSize: number) {
    this.#facade.setPageSize(pageSize);
  }

  toggleSort(field: 'name' | 'size' | 'type' | 'last-modified' | 'created') {
    this.#facade.toggleSort(field);
  }

  public showRoot() {
    if (this.#currentBucket) {
      this.#facade.initRoot();
    }
  }

  async select(document: DocumentModel) {
    this.#facade.setSelectedDocument(document);
  }

  async navigateTo(document: DocumentModel) {
    if (!document) return;
    if (document.isFolder) {
      this.#selectedDocument = document;
      this.#facade.load(this.#selectedDocument);
    } else {
      await this.select(document);
    }
  }

  // ******** //
  onFilesHovered(isHovered: boolean): void {
    this.isDragOver.set(isHovered);
  }

  onFilesDropped(event: { files: File[]; event: DragEvent }): void {
    this.isDragOver.set(false);
    if (event.files && event.files.length > 0) {
      event.files.forEach((file) => this.filemanagerContentFacade.uploadFile(file));
    }
  }

  onFilesRejected(event: { files: File[]; reasons: string[] }): void {
    this.isDragOver.set(false);
    console.error('Dateien abgelehnt:', event.reasons);
    this.filemanagerContentFacade.showErrorToast(
      `${event.files.length} Datei(en) wurden abgelehnt: ${event.reasons.join(', ')}`,
    );
  }

  onContextMenu(event: MouseEvent, document: DocumentModel, index: number) {
    event.preventDefault();
    event.stopPropagation();

    const contextDocuments = this.resolveContextDocuments(document, index);
    const contextDocument = contextDocuments[0] ?? document;
    const isSingleDocumentContext = contextDocuments.length === 1;

    const imageEditorAction =
      isSingleDocumentContext && filemanagerHelper.isImage(contextDocument) && this.isImageEditorPluginInstalled()
        ? () => {
            void this.workspaceService.openImageEditor(contextDocument);
          }
        : undefined;
    const openMediaAction =
      isSingleDocumentContext &&
      (filemanagerHelper.isImage(contextDocument) ||
        filemanagerHelper.isAudio(contextDocument) ||
        filemanagerHelper.isVideo(contextDocument)) &&
      this.isMediaPlayerPluginInstalled()
        ? () => {
            void this.workspaceService.openMediaPlayer(contextDocument);
          }
        : undefined;
    const openEditorAction =
      isSingleDocumentContext && this.monacoEditorService.isEditableFile(contextDocument.key)
        ? () => this.workspaceService.openEditor(contextDocument)
        : undefined;
    const openPdfAction =
      isSingleDocumentContext && filemanagerHelper.isPdf(contextDocument) && this.isPdfViewerPluginInstalled()
        ? () => this.workspaceService.openPdfViewer(contextDocument)
        : undefined;

    this.filemanagerContextMenuService.onContextMenu(
      event,
      contextDocument,
      {
        editImage: imageEditorAction,
        openEditor: openEditorAction,
        openPdf: openPdfAction,
        openAudio: undefined,
        openMedia: openMediaAction,
      },
      contextDocuments,
    );
  }

  private resolveContextDocuments(document: DocumentModel, index: number): DocumentModel[] {
    const visibleDocumentsById = new Set(this.documents().map((doc) => this.documentId(doc)));
    const visibleSelection = this.selectionStore
      .selectedDocuments()
      .filter((selectedDoc) => visibleDocumentsById.has(this.documentId(selectedDoc)));

    const clickedDocumentId = this.documentId(document);
    const clickedDocumentIsInVisibleSelection = visibleSelection.some(
      (selectedDoc) => this.documentId(selectedDoc) === clickedDocumentId,
    );

    if (visibleSelection.length > 1 && clickedDocumentIsInVisibleSelection) {
      return visibleSelection;
    }

    this.selectionStore.selectSingle(document, index);
    return [document];
  }

  toggleSelection(document: DocumentModel, index: number, event: Event) {
    const mouseEvent = event as MouseEvent;
    if (mouseEvent.shiftKey) {
      this.selectionStore.selectRange(this.documents(), index);
      return;
    }

    this.selectionStore.toggleSelection(document, index);
  }

  onItemClick(document: DocumentModel, index: number, event: MouseEvent) {
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      this.toggleSelection(document, index, event);
      this.#facade.setSelectedDocument(document);
    } else {
      this.selectionStore.selectSingle(document, index);
      void this.select(document);
    }
  }

  toggleFavorite(document: DocumentModel) {
    this.favoritesStore.toggleFavorite(document);
  }

  protected readonly Math = Math;

  /* Clipboard */
  private updateOriginList(): void {
    const activeList = this.dropLists.find((list) => {
      const element = list.element.nativeElement;
      return element.offsetParent !== null;
    });

    if (activeList) {
      this.clipboardService.setOriginList(activeList);
    }
  }

  onDropFromClipboard(event: CdkDragDrop<DocumentModel[]>) {
    if (event.previousContainer !== event.container) {
      const droppedDocuments = this.resolveDroppedDocuments(event);
      if (droppedDocuments.length > 0) {
        void this.showMoveOrCopyDialog(droppedDocuments);
      }
    }
  }

  getDragPayload(document: DocumentModel): DocumentModel[] {
    const visibleDocumentsById = new Set(this.documents().map((doc) => this.documentId(doc)));
    const visibleSelection = this.selectionStore
      .selectedDocuments()
      .filter((selectedDoc) => visibleDocumentsById.has(this.documentId(selectedDoc)));

    if (visibleSelection.length > 1 && this.selectionStore.isSelected(document)) {
      return visibleSelection;
    }

    return [document];
  }

  private resolveDroppedDocuments(event: CdkDragDrop<DocumentModel[]>): DocumentModel[] {
    const dragData = event.item.data;
    if (Array.isArray(dragData)) {
      return dragData;
    }

    const fallbackDocument = event.previousContainer.data[event.previousIndex];
    return fallbackDocument ? [fallbackDocument] : [];
  }

  private async showMoveOrCopyDialog(documents: DocumentModel[]) {
    const representativeDocument = documents[0];
    if (!representativeDocument) {
      return;
    }

    const action = await this.moveOrCopyDialogVC.openDialog(representativeDocument);

    if (action === 'move') {
      this.#facade.moveDocuments(documents);
    } else if (action === 'copy') {
      this.#facade.copyDocuments(documents);
    }
  }

  async createFileFromEmptyState(): Promise<void> {
    const invalidChars = /[<>:"/\\|?*]/g;

    const fileName = await this.inputDialogService.prompt({
      title: 'Neue Datei',
      label: 'Dateiname',
      placeholder: 'dokument.txt',
      icon: 'heroDocument',
      confirmText: 'Datei erstellen',
      cancelText: 'Abbrechen',
      validator: (value) => !invalidChars.test(value),
      errorMessage: 'Ungültige Zeichen im Dateinamen (<>:"/\\|?*)',
    });

    if (!fileName) {
      return;
    }

    try {
      this.inputDialogService.setProcessing(true);
      this.#facade.createEmptyFile(fileName);
    } finally {
      this.inputDialogService.setProcessing(false);
    }
  }

  private isImageEditorPluginInstalled(): boolean {
    return isWebComponentRegistered(this.imageEditorTagName);
  }

  private isMediaPlayerPluginInstalled(): boolean {
    return isWebComponentRegistered(this.mediaPlayerTagName);
  }

  private isPdfViewerPluginInstalled(): boolean {
    return isWebComponentRegistered(this.pdfViewerTagName);
  }

  private documentId(document: DocumentModel): string {
    return `${document.bucket || ''}::${document.key || document.path || document.name || ''}`;
  }
}

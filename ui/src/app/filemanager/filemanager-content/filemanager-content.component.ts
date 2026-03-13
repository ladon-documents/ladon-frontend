import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnDestroy,
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
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DocumentModel } from '../../../api';
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
import { LadonRouterService } from '../../services/ladon-router.service';
import { FilemanagerFacade } from '../filemanager.facade';
import { ConverterService } from '../../services/converter.service';
import { SidebarService } from '../sidebar/sidebar.service';
import { FilemanagerPaginationComponent } from '../pagination/pagination.component';
import { PdfViewerFacade } from '../../pdf-viewer/pdf-viewer.facade';
import { filemanagerHelper } from '../helper/helper';
import { FileUploadDirective } from '../../shared/directive/file-upload.directive';
import { FilemanagerContentFacade } from './filemanager-content.facade';
import { UploadProgressComponent } from '../../shared/components/upload-progress/upload-progress.component';
import { ClipboardService } from '../../shared/components/clipboard/clipboard.service';
import { FileEditorDialogComponent } from '../file-editor-dialog/file-editor-dialog.component';
import { MonacoEditorService } from '../../editor/editor.service';
import { FolderComponent } from '@ladon/shared';
import { SelectionStore } from '../../store/selection.store';
import { FavoritesStore } from '../../store/favorites.store';
import { FilemanagerContextMenuService } from '../filemanager-context-menu.service';
import { MoveOrCopyDialogComponent } from '../../shared/components/move-or-copy-dialog/move-or-copy-dialog.component';
import { InputDialogService } from '../../shared/services/input-dialog.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { isWebComponentRegistered } from '@utility';

interface ImageEditorSaveEventDetail {
  blob: Blob;
  fileName: string;
  mimeType: string;
  saveAs: boolean;
}


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
    FileEditorDialogComponent,
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
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FilemanagerContentComponent implements OnDestroy, OnInit, AfterViewInit {
  @ViewChildren(CdkDropList) dropLists!: QueryList<CdkDropList>;
  @ViewChild(MoveOrCopyDialogComponent) moveOrCopyDialogVC!: MoveOrCopyDialogComponent;

  public dateFormat = 'dd.MM.yyyy';
  readonly #facade = inject(FilemanagerFacade);
  readonly filemanagerContentFacade = inject(FilemanagerContentFacade);
  private readonly converterService = inject(ConverterService);
  private readonly sidebarService = inject(SidebarService);
  private readonly pdfViewerFacade = inject(PdfViewerFacade);
  readonly filemanagerContextMenuService = inject(FilemanagerContextMenuService);
  readonly selectionStore = inject(SelectionStore);
  readonly favoritesStore = inject(FavoritesStore);
  readonly clipboardService = inject(ClipboardService);
  readonly inputDialogService = inject(InputDialogService);
  readonly monacoEditorService = inject(MonacoEditorService);
  readonly isEditorOpen = toSignal(this.monacoEditorService.editorOpen$, { initialValue: false });

  protected readonly clipboardList = this.clipboardService.clipboardList;
  documents: Signal<DocumentModel[]> = this.#facade.documents;
  readonly selectedDocument = this.#facade.selectedDocument;

  #currentBucket: string | null = null;
  #subfolder: string | null = null;
  #selectedDocument: DocumentModel | null = null;
  viewMode = this.#facade.viewMode;
  readonly searchTerm = this.#facade.searchTerm;
  readonly sortConfig = this.#facade.sortConfig;

  readonly isImageEditorOpen = signal(false);
  imageEditorSourceUrl: string | null = null;
  imageEditorFileName = '';
  imageEditorMimeType = 'image/png';
  private imageEditorDocument: DocumentModel | null = null;
  private readonly imageEditorTagName = 'ladon-image-editor';
  private readonly audioPlayerTagName = 'ladon-audioplayer';

  isDragOver = signal(false);
  allowedFileTypes: string[] = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png', '.gif', 'yaml', 'yml'];
  maxFileSize = 10 * 1024 * 1024; // 10MB

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ladonRouterService: LadonRouterService,
  ) {}

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

  ngOnDestroy(): void {
    this.revokeImageEditorSourceUrl();
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
      await this.handleDoubleClickForDocument(document);
    }
  }

  private async handleDoubleClickForDocument(document: DocumentModel) {
    if (filemanagerHelper.isPdf(document)) {
      await this.pdfViewerFacade.navigateToPdfViewer(document);
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

  onContextMenu(event: MouseEvent, document: DocumentModel) {
    event.preventDefault();
    event.stopPropagation();

    const imageEditorAction =
      filemanagerHelper.isImage(document) && this.isImageEditorPluginInstalled()
        ? () => {
            void this.openImageEditor(document);
          }
        : undefined;
    const openAudioAction =
      filemanagerHelper.isAudio(document) && this.isAudioPlayerPluginInstalled()
        ? () => {
            this.openAudioPlayerFromContextMenu(document);
          }
        : undefined;

    this.filemanagerContextMenuService.onContextMenu(event, document, {
      editImage: imageEditorAction,
      openEditor: this.monacoEditorService.isEditableFile(document.key) ? () => this.openTextEditor(document) : undefined,
      openPdf: filemanagerHelper.isPdf(document) ? () => this.openPdfFromContextMenu(document) : undefined,
      openAudio: openAudioAction,
    });
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

  private async openImageEditor(document: DocumentModel): Promise<void> {
    try {
      const response = await firstValueFrom(this.#facade.getDocument(document));
      const blob = response instanceof Blob ? response : new Blob([response]);

      this.revokeImageEditorSourceUrl();
      this.imageEditorSourceUrl = URL.createObjectURL(blob);
      this.imageEditorFileName = this.extractFileName(document);
      this.imageEditorMimeType = document['content-type'] || blob.type || 'image/png';
      this.imageEditorDocument = document;
      this.isImageEditorOpen.set(true);
    } catch (error) {
      this.filemanagerContentFacade.showErrorToast(`Bild konnte nicht geladen werden: ${String(error)}`);
    }
  }

  closeImageEditor(): void {
    this.isImageEditorOpen.set(false);
    this.imageEditorDocument = null;
    this.imageEditorFileName = '';
    this.imageEditorMimeType = 'image/png';
    this.revokeImageEditorSourceUrl();
  }

  async onImageEditorSave(event: Event): Promise<void> {
    const detail = (event as CustomEvent<ImageEditorSaveEventDetail>).detail;
    if (!detail?.blob || !this.imageEditorDocument) {
      return;
    }

    const targetDocument = this.buildTargetDocumentForImageSave(this.imageEditorDocument, detail.fileName);

    try {
      await firstValueFrom(this.#facade.saveDocument(targetDocument, detail.blob));
      this.#facade.reloadCurrentLocation();
      this.closeImageEditor();
    } catch (error) {
      this.filemanagerContentFacade.showErrorToast(`Bild konnte nicht gespeichert werden: ${String(error)}`);
    }
  }

  private openTextEditor(document: DocumentModel): void {
    this.#facade.setSelectedDocument(document);
    this.monacoEditorService.open();
  }

  private async openPdfFromContextMenu(document: DocumentModel): Promise<void> {
    this.#facade.setSelectedDocument(document);
    await this.pdfViewerFacade.navigateToPdfViewer(document);
  }

  private openAudioPlayerFromContextMenu(document: DocumentModel): void {
    this.#facade.setSelectedDocument(document);
    this.openPreviewSidebar();
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

  private buildTargetDocumentForImageSave(document: DocumentModel, fileName: string): DocumentModel {
    const normalizedFileName = fileName.trim().replace(/^\/+/, '');
    if (!normalizedFileName) {
      return document;
    }

    const currentKey = document.key || document.path || '';
    const lastSlash = currentKey.lastIndexOf('/');
    const directory = lastSlash >= 0 ? currentKey.substring(0, lastSlash + 1) : '';
    const targetKey = `${directory}${normalizedFileName}`;

    return {
      ...document,
      key: targetKey,
      path: targetKey,
      name: normalizedFileName,
      'content-type': document['content-type'],
    };
  }

  private extractFileName(document: DocumentModel): string {
    const key = document.key || document.path || document.name || 'edited-image';
    const lastSlash = key.lastIndexOf('/');
    return lastSlash >= 0 ? key.substring(lastSlash + 1) : key;
  }

  private revokeImageEditorSourceUrl(): void {
    if (!this.imageEditorSourceUrl) {
      return;
    }
    URL.revokeObjectURL(this.imageEditorSourceUrl);
    this.imageEditorSourceUrl = null;
  }

  private isImageEditorPluginInstalled(): boolean {
    return isWebComponentRegistered(this.imageEditorTagName);
  }

  private isAudioPlayerPluginInstalled(): boolean {
    return isWebComponentRegistered(this.audioPlayerTagName);
  }

  private openPreviewSidebar(): void {
    if (this.sidebarService.mode() !== 'preview') {
      this.sidebarService.togglePreviewMode();
      return;
    }

    this.sidebarService.openSidebar();
  }

  private documentId(document: DocumentModel): string {
    return `${document.bucket || ''}::${document.key || document.path || document.name || ''}`;
  }
}

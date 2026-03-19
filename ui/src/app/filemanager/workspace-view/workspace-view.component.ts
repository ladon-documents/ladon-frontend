import { Component, CUSTOM_ELEMENTS_SCHEMA, effect, inject } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroArrowLeft } from '@ng-icons/heroicons/outline';
import { MonacoEditorService } from '../../editor/editor.service';
import { FilemanagerWorkspaceService } from '../filemanager-workspace.service';
import { FilemanagerFacade } from '../filemanager.facade';
import { toSignal } from '@angular/core/rxjs-interop';
import { FileEditorDialogComponent } from '../file-editor-dialog/file-editor-dialog.component';
import { PdfViewerComponent } from '../../pdf-viewer/pdf-viewer.component';

@Component({
  standalone: true,
  selector: 'filemanager-workspace-view',
  imports: [NgIconComponent, FileEditorDialogComponent, PdfViewerComponent],
  providers: [
    provideIcons({
      heroArrowLeft,
    }),
  ],
  templateUrl: './workspace-view.component.html',
  styleUrl: './workspace-view.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FilemanagerWorkspaceViewComponent {
  private readonly monacoEditorService = inject(MonacoEditorService);
  readonly workspaceService = inject(FilemanagerWorkspaceService);
  private readonly filemanagerFacade = inject(FilemanagerFacade);

  readonly selectedDocument = this.filemanagerFacade.selectedDocument;
  readonly isEditorOpen = toSignal(this.monacoEditorService.editorOpen$, { initialValue: false });
  readonly workspaceMode = this.workspaceService.mode;
  readonly workspaceIsPreparing = this.workspaceService.isPreparing;

  constructor() {
    effect(() => {
      if (this.workspaceMode() === 'editor' && !this.isEditorOpen()) {
        this.workspaceService.closeEditorViewAfterEditorClosed();
      }
    });
  }

  closeWorkspaceView(): void {
    this.workspaceService.closeActiveView();
  }

  async onImageEditorSave(event: Event): Promise<void> {
    await this.workspaceService.saveImageEditor(event);
  }
}

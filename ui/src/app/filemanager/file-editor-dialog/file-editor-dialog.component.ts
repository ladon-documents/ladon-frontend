import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  inject,
  input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroArrowPath, heroCheck, heroDocumentText, heroXMark } from '@ng-icons/heroicons/outline';
import { EditorConfig, MonacoEditorService } from '../../editor/editor.service';
import { MonacoEditorComponent } from '../../editor/editor.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'file-editor-dialog',
  standalone: true,
  imports: [CommonModule, NgIconComponent, MonacoEditorComponent],
  providers: [
    provideIcons({
      heroXMark,
      heroDocumentText,
      heroCheck,
      heroArrowPath,
    }),
  ],
  templateUrl: 'file-editor-dialog.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FileEditorDialogComponent implements OnDestroy {
  public fileContent: string = '';
  public isOpen: boolean = false;
  private readonly monacoEditorService = inject(MonacoEditorService);
  private subscriptions = new Subscription();

  @ViewChild('editor') editor!: MonacoEditorComponent;

  config = input.required<{
    readOnly: boolean;
    fileName: string;
  }>();

  @Output() closeEvent = new EventEmitter<void>();
  @Output() saveEvent = new EventEmitter<string>();

  editorConfig: EditorConfig | null = null;
  currentContent: string = '';
  originalContent: string = '';
  hasChanges: boolean = false;
  isSaving: boolean = false;
  monacoEditor: any;

  constructor() {
    this.subscriptions.add(
      this.monacoEditorService.editorOpen$.subscribe(async (isOpen) => {
        if (isOpen) {
          await this.loadFileContent();
        }
        this.isOpen = isOpen;
      }),
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  onEditorReady(editor: any) {
    this.monacoEditor = editor;
  }

  onContentChange(content: string) {
    this.currentContent = content;
    this.hasChanges = content !== this.originalContent;
  }

  toggleTheme() {
    if (this.editorConfig && this.editor) {
      const newTheme = this.editorConfig.theme === 'vs-dark' ? 'vs' : 'vs-dark';
      this.editorConfig.theme = newTheme;
      this.editor.setTheme(newTheme);
    }
  }

  async loadFileContent() {
    this.fileContent = await this.monacoEditorService.loadFileContent();
    if (this.config().fileName) {
      this.editorConfig = this.monacoEditorService.getEditorConfig(this.config().fileName, this.config().readOnly);
      this.originalContent = this.fileContent;
      this.currentContent = this.fileContent;
    }
  }

  async saveFile() {
    if (this.isSaving || !this.hasChanges) return;
    this.isSaving = true;
    try {
      await this.monacoEditorService.saveFileContent(this.currentContent);
      this.originalContent = this.currentContent;
      this.hasChanges = false;
    } finally {
      this.isSaving = false;
    }
  }

  discardChanges() {
    this.editor.setValue(this.originalContent);
    this.currentContent = this.originalContent;
    this.hasChanges = false;
  }

  closeDialog() {
    if (this.hasChanges) {
      const shouldClose = confirm('Es gibt ungespeicherte Änderungen. Möchten Sie wirklich schließen?');
      if (!shouldClose) return;
    }
    this.monacoEditorService.close();
    this.isOpen = false;
  }
}

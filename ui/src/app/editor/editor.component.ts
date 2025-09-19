
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

declare const monaco: any;

@Component({
  selector: 'monaco-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="monaco-editor-container w-full h-full" #editorContainer></div>
  `,
  styles: [`
    .monaco-editor-container {
      min-height: 400px;
    }
  `],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MonacoEditorComponent implements OnInit, OnDestroy {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
  @Input() value: string = '';
  @Input() language: string = 'javascript';
  @Input() theme: string = 'vs-dark';
  @Input() readOnly: boolean = false;
  @Input() options: any = {};

  @Output() valueChange = new EventEmitter<string>();
  @Output() editorReady = new EventEmitter<any>();

  private editor: any;
  private isMonacoLoaded = false;

  ngOnInit() {
    this.loadMonacoEditor();
  }

  ngOnDestroy() {
    if (this.editor) {
      this.editor.dispose();
    }
  }

  private async loadMonacoEditor() {
    if (typeof monaco !== 'undefined') {
      this.isMonacoLoaded = true;
      this.initializeEditor();
      return;
    }

    // Monaco Editor über CDN laden
    await this.loadMonacoScript();
    this.isMonacoLoaded = true;
    this.initializeEditor();
  }

  private loadMonacoScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Monaco Editor CSS laden
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/editor/editor.main.css';
      document.head.appendChild(cssLink);

      // Monaco Editor Loader laden
      const loaderScript = document.createElement('script');
      loaderScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js';
      loaderScript.onload = () => {
        // Monaco Editor konfigurieren und laden
        (window as any).require.config({
          paths: {
            'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs'
          }
        });

        (window as any).require(['vs/editor/editor.main'], () => {
          resolve();
        });
      };
      loaderScript.onerror = reject;
      document.head.appendChild(loaderScript);
    });
  }

  private initializeEditor() {
    if (!this.isMonacoLoaded) return;

    const editorOptions = {
      value: this.value,
      language: this.language,
      theme: this.theme,
      readOnly: this.readOnly,
      automaticLayout: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'on' as const,
      lineNumbers: 'on' as const,
      renderLineHighlight: 'line' as const,
      selectOnLineNumbers: true,
      roundedSelection: false,
      cursorStyle: 'line' as const,
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      ...this.options
    };

    this.editor = monaco.editor.create(this.editorContainer.nativeElement, editorOptions);

    this.editor.onDidChangeModelContent(() => {
      const currentValue = this.editor.getValue();
      this.valueChange.emit(currentValue);
    });

    this.editorReady.emit(this.editor);

    window.addEventListener('resize', () => {
      if (this.editor) {
        this.editor.layout();
      }
    });
  }

  public setValue(value: string) {
    if (this.editor) {
      this.editor.setValue(value);
    } else {
      this.value = value;
    }
  }

  public getValue(): string {
    return this.editor ? this.editor.getValue() : this.value;
  }

  public setLanguage(language: string) {
    if (this.editor) {
      monaco.editor.setModelLanguage(this.editor.getModel(), language);
    }
    this.language = language;
  }

  public setTheme(theme: string) {
    if (this.editor) {
      monaco.editor.setTheme(theme);
    }
    this.theme = theme;
  }

  public focus() {
    if (this.editor) {
      this.editor.focus();
    }
  }

  public layout() {
    if (this.editor) {
      this.editor.layout();
    }
  }
}

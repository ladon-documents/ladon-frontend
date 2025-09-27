import { EventEmitter, inject, Injectable, Output } from '@angular/core';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { FilemanagerFacade } from '../filemanager/filemanager.facade';
import { DocumentModel } from '../../api';

export interface EditorConfig {
  language: string;
  theme: string;
  readOnly: boolean;
  options?: any;
}

@Injectable({
  providedIn: 'root',
})
export class MonacoEditorService {
  private readonly filemanagerFacade = inject(FilemanagerFacade);
  private selectedDocument = this.filemanagerFacade.selectedDocument;
  private editorOpenSubject = new BehaviorSubject<boolean>(false);

  editorOpen$ = this.editorOpenSubject.asObservable();

  open() {
    this.editorOpenSubject.next(true);
  }

  close() {
    this.editorOpenSubject.next(false);
  }

  getLanguageFromFileName(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    const languageMap: { [key: string]: string } = {
      js: 'javascript',
      ts: 'typescript',
      html: 'html',
      css: 'css',
      scss: 'scss',
      less: 'less',
      json: 'json',
      xml: 'xml',
      md: 'markdown',
      py: 'python',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      cs: 'csharp',
      php: 'php',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      sql: 'sql',
      yaml: 'yaml',
      yml: 'yaml',
      sh: 'shell',
      ps1: 'powershell',
      dockerfile: 'dockerfile',
      txt: 'plaintext',
    };

    return languageMap[extension || ''] || 'plaintext';
  }

  getTheme(): string {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'vs-dark' : 'vs';
  }

  getEditorConfig(fileName: string, readOnly: boolean = false): EditorConfig {
    const language = this.getLanguageFromFileName(fileName);
    const theme = this.getTheme();

    const options = {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      minimap: { enabled: language !== 'plaintext' },
      wordWrap: language === 'markdown' || language === 'plaintext' ? ('on' as const) : ('off' as const),
      scrollBeyondLastLine: false,
      automaticLayout: true,
      contextmenu: true,
      find: {
        addExtraSpaceOnTop: false,
        autoFindInSelection: 'never' as const,
        seedSearchStringFromSelection: 'always' as const,
      },
    };

    return {
      language,
      theme,
      readOnly,
      options,
    };
  }

  isEditableFile(fileName?: string): boolean {
    if (!fileName) return false;

    const editableExtensions = [
      'txt',
      'md',
      'js',
      'ts',
      'html',
      'css',
      'scss',
      'json',
      'xml',
      'py',
      'java',
      'c',
      'cpp',
      'cs',
      'php',
      'rb',
      'go',
      'rs',
      'sql',
      'yaml',
      'yml',
      'sh',
      'ps1',
      'dockerfile',
      'vm',
    ];

    const extension = fileName.split('.').pop()?.toLowerCase();
    return editableExtensions.includes(extension || '');
  }

  async saveFileContent(content: string) {
    const document = this.selectedDocument();
    if (!document?.key) return;
    try {
      const blob = new Blob([content], { type: 'text/plain' });

      await this.saveFileToServer(document, blob);
      console.log('Datei gespeichert:', document.key);
    } catch (error) {
      console.error('Fehler beim Speichern der Datei:', error);
    }
  }

  async loadFileContent(): Promise<any> {
    try {
      const document = this.selectedDocument();
      if (document) {
        const blob =  await lastValueFrom(this.filemanagerFacade.getDocument(document));
        return   await this.convertBlobToString(blob);

      }
    } catch (error) {
      console.error('Fehler beim Laden der Datei:', error);
    }
  }

  private async saveFileToServer(document: any, content: Blob): Promise<void> {
    this.filemanagerFacade.saveDocument(document, content).subscribe((res) => {
      console.log(res);
    });
  }
  private async convertBlobToString(blob: Blob): Promise<string> {
    return await blob.text();
  }

}

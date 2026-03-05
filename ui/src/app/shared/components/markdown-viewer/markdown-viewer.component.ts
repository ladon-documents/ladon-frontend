import { Component, inject, OnInit } from '@angular/core';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { MonacoEditorService } from '../../../editor/editor.service';

@Component({
  selector: 'app-markdown-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './markdown-viewer.component.html',
  styleUrls: ['./markdown-viewer.component.scss'],
})
export class MarkdownViewerComponent implements OnInit {
  content: string | undefined;
  private editorService = inject(MonacoEditorService);
  private sanitizer = inject(DomSanitizer);

  renderedMarkdown: SafeHtml = '';
  isLoading = true;

  async ngOnInit() {
    await this.loadAndRenderMarkdown();
  }

  async loadAndRenderMarkdown() {
    try {
      this.content = await this.editorService.loadFileContent();
      if (this.content) {
        const html = marked.parse(this.content);
        this.renderedMarkdown = this.sanitizer.sanitize(1, html) || '';
      }

      this.isLoading = false;
    } catch (error) {
      console.error('Fehler beim Laden der Markdown-Datei:', error);
      this.isLoading = false;
    }
  }
}

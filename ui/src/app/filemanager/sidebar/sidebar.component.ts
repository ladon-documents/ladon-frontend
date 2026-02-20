import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarService } from './sidebar.service';
import { Subscription } from 'rxjs';
import { FilemanagerFacade } from '../filemanager.facade';
import { MetaComponent } from '../meta/meta.component';
import { MonacoEditorService } from '../../editor/editor.service';
import { PreviewComponent } from '../preview/preview.component';
import { ClipboardComponent } from '../../shared/components/clipboard/clipboard.component';
import { SidebarResizerComponent } from './sidebar-resizer.component';
import { FileEditorDialogComponent } from '../file-editor-dialog/file-editor-dialog.component';
import { ClipboardStore } from '../../store/clipboard.store';

@Component({
  selector: 'filemanager-sidebar',
  imports: [
    CommonModule,
    MetaComponent,
    SidebarResizerComponent,
    FileEditorDialogComponent,
    PreviewComponent,
    ClipboardComponent,
  ],
  providers: [],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SidebarComponent implements OnDestroy {
  private readonly monacoEditorService = inject(MonacoEditorService);
  private readonly filemanagerFacade = inject(FilemanagerFacade);
  readonly sidebarService = inject(SidebarService);
  readonly clipboardStore = inject(ClipboardStore);

  selectedDocument = this.filemanagerFacade.selectedDocument;
  private subscriptions = new Subscription();

  activeTab = signal<'clipboard' | 'meta'>('meta');

  get isOpen() {
    return this.sidebarService.isOpen();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  closeSidebar() {
    this.sidebarService.closeSidebar();
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  setActiveTab(tab: 'clipboard' | 'meta') {
    this.activeTab.set(tab);
  }
}

import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarService } from './sidebar.service';
import { lastValueFrom, Subscription } from 'rxjs';
import { FilemanagerFacade } from '../filemanager.facade';
import { MetaComponent } from '../meta/meta.component';
import { FileEditorDialogComponent } from '../file-editor-dialog/file-editor-dialog.component';
import { MonacoEditorService } from '../../editor/editor.service';
import { PreviewComponent } from '../preview/preview.component';

@Component({
  selector: 'filemanager-sidebar',
  imports: [CommonModule, MetaComponent, FileEditorDialogComponent, PreviewComponent],
  providers: [],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit, OnDestroy {
  private readonly monacoEditorService = inject(MonacoEditorService);
  private readonly filemanagerFacade = inject(FilemanagerFacade);
  private readonly sidebarService = inject(SidebarService);

  selectedDocument = this.filemanagerFacade.selectedDocument;
  isOpen = false;
  private subscriptions = new Subscription();

  ngOnInit() {
    this.subscriptions.add(
      this.sidebarService.sidebarOpen$.subscribe(async (isOpen) => {
        this.isOpen = isOpen;
      }),
    );
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

}


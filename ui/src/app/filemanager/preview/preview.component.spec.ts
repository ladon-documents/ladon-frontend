import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { heroTrash } from '@ng-icons/heroicons/outline';
import { DocumentModel, TagModel } from '../../../api';

import { PreviewComponent } from './preview.component';
import { FilemanagerFacade } from '../filemanager.facade';
import { MonacoEditorService } from '../../editor/editor.service';
import { PdfViewerFacade } from '../../pdf-viewer/pdf-viewer.facade';
import { FilemanagerTagsFacade } from '../tags/filemanager-tags.facade';

class FilemanagerFacadeMock {
  selectedDocument = signal<DocumentModel | null>(null);
  getImagePreviewUrll = jasmine.createSpy('getImagePreviewUrll').and.resolveTo(null);
}

class MonacoEditorServiceMock {
  isEditableFile = jasmine.createSpy('isEditableFile').and.returnValue(false);
  open = jasmine.createSpy('open');
}

class PdfViewerFacadeMock {
  navigateToPdfViewer = jasmine.createSpy('navigateToPdfViewer');
}

class FilemanagerTagsFacadeMock {
  documentId = signal<string | null>('doc-path');
  tags = signal<TagModel[]>([]);
  isLoading = signal(false);
  isMutating = signal(false);
  error = signal<string | null>(null);

  loadForDocument = jasmine.createSpy('loadForDocument');
  addTag = jasmine.createSpy('addTag');
  deleteTag = jasmine.createSpy('deleteTag');
  clearState = jasmine.createSpy('clearState');
}

describe('PreviewComponent', () => {
  let component: PreviewComponent;
  let fixture: ComponentFixture<PreviewComponent>;
  let filemanagerFacade: FilemanagerFacadeMock;
  let tagsFacade: FilemanagerTagsFacadeMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewComponent],
      providers: [
        provideIcons({ heroTrash }),
        { provide: FilemanagerFacade, useClass: FilemanagerFacadeMock },
        { provide: MonacoEditorService, useClass: MonacoEditorServiceMock },
        { provide: PdfViewerFacade, useClass: PdfViewerFacadeMock },
        { provide: FilemanagerTagsFacade, useClass: FilemanagerTagsFacadeMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PreviewComponent);
    component = fixture.componentInstance;
    filemanagerFacade = TestBed.inject(FilemanagerFacade) as unknown as FilemanagerFacadeMock;
    tagsFacade = TestBed.inject(FilemanagerTagsFacade) as unknown as FilemanagerTagsFacadeMock;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show tag section only for files', () => {
    filemanagerFacade.selectedDocument.set({
      key: 'folder',
      path: 'folder',
      isFolder: true,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Tags');

    filemanagerFacade.selectedDocument.set({
      key: 'folder/file.txt',
      path: 'folder/file.txt',
      isFolder: false,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tags');
  });

  it('should add a tag on Enter', () => {
    filemanagerFacade.selectedDocument.set({
      key: 'folder/file.txt',
      path: 'folder/file.txt',
      isFolder: false,
    });
    tagsFacade.documentId.set('folder/file.txt');
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[placeholder="Tag hinzufügen..."]');
    input.value = 'Rechnung';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(tagsFacade.addTag).toHaveBeenCalledWith('Rechnung');
  });

  it('should delete a tag by clicking the remove button', () => {
    filemanagerFacade.selectedDocument.set({
      key: 'folder/file.txt',
      path: 'folder/file.txt',
      isFolder: false,
    });
    tagsFacade.tags.set([
      {
        id: 'tag-1',
        name: 'Tag',
        value: 'Tag',
        color: '#111111',
      },
    ]);
    fixture.detectChanges();

    const removeButton: HTMLButtonElement = fixture.nativeElement.querySelector('app-pill button[title="Entfernen"]');
    removeButton.click();

    expect(tagsFacade.deleteTag).toHaveBeenCalledWith('tag-1');
  });

  it('should render loading, empty and error states', () => {
    filemanagerFacade.selectedDocument.set({
      key: 'folder/file.txt',
      path: 'folder/file.txt',
      isFolder: false,
    });
    tagsFacade.isLoading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tags werden geladen...');

    tagsFacade.isLoading.set(false);
    tagsFacade.tags.set([]);
    tagsFacade.error.set(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Noch keine Tags');

    tagsFacade.error.set('Backend-Fehler');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Backend-Fehler');
  });
});

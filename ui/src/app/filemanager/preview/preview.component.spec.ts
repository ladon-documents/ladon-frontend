import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { heroTrash } from '@ng-icons/heroicons/outline';
import { DocumentModel, TagModel } from '@ladon/api';

import { PreviewComponent } from './preview.component';
import { FilemanagerFacade } from '../filemanager.facade';
import { DocumentTagsFacade } from '../../shared/services/document-tags.facade';
import { FilemanagerWorkspaceService } from '../filemanager-workspace.service';

class FilemanagerFacadeMock {
  selectedDocument = signal<DocumentModel | null>(null);
  getImagePreviewUrll = jasmine.createSpy('getImagePreviewUrll').and.resolveTo(null);
}

class DocumentTagsFacadeMock {
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

class FilemanagerWorkspaceServiceMock {
  openEditor = jasmine.createSpy('openEditor');
  openPdfViewer = jasmine.createSpy('openPdfViewer');
}

describe('PreviewComponent', () => {
  let component: PreviewComponent;
  let fixture: ComponentFixture<PreviewComponent>;
  let filemanagerFacade: FilemanagerFacadeMock;
  let workspaceService: FilemanagerWorkspaceServiceMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewComponent],
      providers: [
        provideIcons({ heroTrash }),
        { provide: FilemanagerFacade, useClass: FilemanagerFacadeMock },
        { provide: DocumentTagsFacade, useClass: DocumentTagsFacadeMock },
        { provide: FilemanagerWorkspaceService, useClass: FilemanagerWorkspaceServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PreviewComponent);
    component = fixture.componentInstance;
    filemanagerFacade = TestBed.inject(FilemanagerFacade) as unknown as FilemanagerFacadeMock;
    workspaceService = TestBed.inject(FilemanagerWorkspaceService) as unknown as FilemanagerWorkspaceServiceMock;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render shared tags component only for files', () => {
    filemanagerFacade.selectedDocument.set({
      key: 'folder',
      path: 'folder',
      isFolder: true,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-document-tags')).toBeNull();

    filemanagerFacade.selectedDocument.set({
      key: 'folder/file.txt',
      path: 'folder/file.txt',
      name: 'file.txt',
      isFolder: false,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-document-tags')).not.toBeNull();
  });

  it('should open the editor for editable files', () => {
    filemanagerFacade.selectedDocument.set({
      key: 'folder/file.txt',
      path: 'folder/file.txt',
      name: 'file.txt',
      isFolder: false,
    });
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();

    expect(workspaceService.openEditor).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({ path: 'folder/file.txt' }),
    );
    expect(workspaceService.openPdfViewer).not.toHaveBeenCalled();
  });

  it('should open the pdf viewer for pdf files', () => {
    filemanagerFacade.selectedDocument.set({
      key: 'folder/file.pdf',
      path: 'folder/file.pdf',
      name: 'file.pdf',
      isFolder: false,
    });
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();

    expect(workspaceService.openPdfViewer).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({ path: 'folder/file.pdf' }),
    );
    expect(workspaceService.openEditor).not.toHaveBeenCalled();
  });

  it('should render an image preview for images', async () => {
    filemanagerFacade.getImagePreviewUrll.and.resolveTo('blob:preview-image');
    filemanagerFacade.selectedDocument.set({
      key: 'folder/image.png',
      path: 'folder/image.png',
      name: 'image.png',
      isFolder: false,
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(filemanagerFacade.getImagePreviewUrll).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('img')?.getAttribute('src')).toBe('blob:preview-image');
    expect(fixture.nativeElement.querySelector('app-document-tags')).not.toBeNull();
  });

  it('should hide the primary action button for unsupported files', () => {
    filemanagerFacade.selectedDocument.set({
      key: 'folder/archive.zip',
      path: 'folder/archive.zip',
      name: 'archive.zip',
      isFolder: false,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });
});

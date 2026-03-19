import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { heroTrash } from '@ng-icons/heroicons/outline';
import { signal } from '@angular/core';
import { DocumentModel, TagModel } from '../../../../api';

import { DocumentTagsComponent } from './document-tags.component';
import { DocumentTagsFacade } from '../../services/document-tags.facade';

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

describe('DocumentTagsComponent', () => {
  let component: DocumentTagsComponent;
  let fixture: ComponentFixture<DocumentTagsComponent>;
  let facade: DocumentTagsFacadeMock;

  const document: DocumentModel = {
    key: 'folder/file.txt',
    path: 'folder/file.txt',
    name: 'file.txt',
    isFolder: false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentTagsComponent],
      providers: [
        provideIcons({ heroTrash }),
        { provide: DocumentTagsFacade, useClass: DocumentTagsFacadeMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentTagsComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(DocumentTagsFacade) as unknown as DocumentTagsFacadeMock;
    fixture.componentRef.setInput('document', document);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tags for the provided document', () => {
    expect(facade.loadForDocument).toHaveBeenCalledWith(jasmine.objectContaining({ path: 'folder/file.txt' }));
  });

  it('should add a tag on Enter', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[placeholder="Tag hinzufügen..."]');
    input.value = 'Rechnung';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(facade.addTag).toHaveBeenCalledWith('Rechnung');
  });

  it('should delete a tag by clicking the remove button', () => {
    facade.tags.set([
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

    expect(facade.deleteTag).toHaveBeenCalledWith('tag-1');
  });

  it('should render loading, empty and error states', () => {
    facade.isLoading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tags werden geladen...');

    facade.isLoading.set(false);
    facade.tags.set([]);
    facade.error.set(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Noch keine Tags');

    facade.error.set('Backend-Fehler');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Backend-Fehler');
  });

  it('should clear the state when the input document becomes null', () => {
    fixture.componentRef.setInput('document', null);
    fixture.detectChanges();

    expect(facade.clearState).toHaveBeenCalled();
  });
});

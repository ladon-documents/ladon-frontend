import { inject, Injectable } from '@angular/core';
import { DocumentModel } from '../../../api';
import { FilemanagerTagsStore } from '../../store/filemanager-tags.store';

@Injectable({
  providedIn: 'root',
})
export class FilemanagerTagsFacade {
  readonly #store = inject(FilemanagerTagsStore);

  readonly documentId = this.#store.documentId;
  readonly tags = this.#store.tags;
  readonly isLoading = this.#store.isLoading;
  readonly isMutating = this.#store.isMutating;
  readonly error = this.#store.error;

  loadForDocument(document: DocumentModel | null) {
    this.#store.setDocument(document);
  }

  addTag(value: string) {
    this.#store.addTag(value);
  }

  deleteTag(tagId: string) {
    this.#store.deleteTag(tagId);
  }

  clearState() {
    this.#store.clearState();
  }
}

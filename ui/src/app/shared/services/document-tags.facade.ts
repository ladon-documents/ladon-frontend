import { inject, Injectable } from '@angular/core';
import { Document } from '@ladon/api';
import { FilemanagerTagsStore } from '../../store/filemanager-tags.store';

@Injectable({
  providedIn: 'root',
})
export class DocumentTagsFacade {
  readonly #store = inject(FilemanagerTagsStore);

  readonly documentId = this.#store.documentId;
  readonly tags = this.#store.tags;
  readonly isLoading = this.#store.isLoading;
  readonly isMutating = this.#store.isMutating;
  readonly error = this.#store.error;

  loadForDocument(document: Document | null) {
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

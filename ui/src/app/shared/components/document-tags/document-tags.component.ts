import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { DocumentModel } from '../../../../api';
import { PillComponent } from '../pill/pill.component';
import { DocumentTagsFacade } from '../../services/document-tags.facade';

@Component({
  standalone: true,
  selector: 'app-document-tags',
  imports: [PillComponent],
  templateUrl: './document-tags.component.html',
  styleUrl: './document-tags.component.scss',
})
export class DocumentTagsComponent {
  readonly document = input<DocumentModel | null>(null);

  private readonly documentTagsFacade = inject(DocumentTagsFacade);

  readonly tags = this.documentTagsFacade.tags;
  readonly isTagsLoading = this.documentTagsFacade.isLoading;
  readonly isTagsMutating = this.documentTagsFacade.isMutating;
  readonly tagsError = this.documentTagsFacade.error;
  readonly tagsDocumentId = this.documentTagsFacade.documentId;
  readonly tagInput = signal('');

  constructor() {
    effect(() => {
      const document = this.document();
      untracked(() => {
        if (document && !document.isFolder) {
          this.documentTagsFacade.loadForDocument(document);
        } else {
          this.documentTagsFacade.clearState();
        }
      });
      this.tagInput.set('');
    });
  }

  onTagInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.tagInput.set(target.value);
  }

  onTagKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    }
  }

  addTag() {
    const value = this.tagInput().trim();
    if (!value || this.isTagsMutating() || !this.tagsDocumentId()) {
      return;
    }

    this.documentTagsFacade.addTag(value);
    this.tagInput.set('');
  }

  deleteTag(tagId: string) {
    if (!tagId || this.isTagsMutating()) {
      return;
    }

    this.documentTagsFacade.deleteTag(tagId);
  }
}

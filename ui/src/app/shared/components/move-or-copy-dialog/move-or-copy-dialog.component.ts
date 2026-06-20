import { Component, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogComponent } from '@ladon/shared';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroDocumentDuplicate, heroArrowRight } from '@ng-icons/heroicons/outline';
import { Document } from '@ladon/api';

@Component({
  selector: 'move-or-copy-dialog',
  standalone: true,
  imports: [CommonModule, DialogComponent, NgIconComponent],
  providers: [
    provideIcons({
      heroDocumentDuplicate,
      heroArrowRight,
    }),
  ],
  templateUrl: './move-or-copy-dialog.component.html',
})
export class MoveOrCopyDialogComponent {
  @ViewChild(DialogComponent, { static: true }) dialog: DialogComponent | undefined;

  document = signal<Document | null>(null);
  private resolveCallback: ((action: 'move' | 'copy' | null) => void) | null = null;

  openDialog(document: Document): Promise<'move' | 'copy' | null> {
    this.document.set(document);
    this.dialog?.openDialog();

    return new Promise((resolve) => {
      this.resolveCallback = resolve;
    });
  }

  closeDialog(): void {
    this.dialog?.closeDialog();
    if (this.resolveCallback) {
      this.resolveCallback(null);
      this.resolveCallback = null;
    }
  }

  onAction(action: 'move' | 'copy'): void {
    if (this.resolveCallback) {
      this.resolveCallback(action);
      this.resolveCallback = null;
    }
    this.dialog?.closeDialog();
  }
}

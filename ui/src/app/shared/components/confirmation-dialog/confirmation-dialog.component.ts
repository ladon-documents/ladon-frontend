import { Component, inject, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationDialogService } from '../../services/confirmation-dialog.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroExclamationTriangle } from '@ng-icons/heroicons/outline';
import { DialogComponent } from '../dialog/dialog.component';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, NgIcon, DialogComponent],
  providers: [
    provideIcons({
      heroExclamationTriangle,
    }),
  ],
  templateUrl: './confirmation-dialog.component.html'
})
export class ConfirmationDialogComponent {
  @ViewChild(DialogComponent, { static: true }) dialog: DialogComponent | undefined;

  readonly confirmationDialogService = inject(ConfirmationDialogService);

  constructor() {
    effect(() => {
      const state = this.confirmationDialogService.state();
      if (state.visible) {
        this.dialog?.openDialog();
      } else {
        this.dialog?.closeDialog();
      }
    });
  }

  onConfirm(): void {
    this.confirmationDialogService.handleConfirm();
  }

  onCancel(): void {
    this.confirmationDialogService.handleCancel();
  }

  closeDialog(): void {
    this.confirmationDialogService.handleCancel();
  }
}

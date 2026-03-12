import { Component, inject, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogComponent } from '../dialog/dialog.component';
import { InputDialogService } from '../../services/input-dialog.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroExclamationCircle } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-input-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogComponent, NgIconComponent, ReactiveFormsModule],
  providers: [
    provideIcons({
      heroExclamationCircle,
    }),
  ],
  templateUrl: './input-dialog.component.html',
  styleUrl: './input-dialog.component.scss',
})
export class InputDialogComponent {
  @ViewChild(DialogComponent, { static: true }) dialog: DialogComponent | undefined;

  readonly inputDialogService = inject(InputDialogService);

  constructor() {
    effect(() => {
      const state = this.inputDialogService.state();
      if (state.visible) {
        this.dialog?.openDialog();
      } else {
        this.dialog?.closeDialog();
      }
    });
  }

  onValueChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.inputDialogService.updateValue(target.value);
  }

  onConfirm(): void {
    this.inputDialogService.handleConfirm();
  }

  onCancel(): void {
    this.inputDialogService.handleCancel();
  }

  closeDialog(): void {
    this.inputDialogService.handleCancel();
  }
}

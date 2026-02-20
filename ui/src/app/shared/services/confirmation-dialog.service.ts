import { Injectable, signal } from '@angular/core';

export interface ConfirmationDialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface DialogState {
  visible: boolean;
  config: ConfirmationDialogConfig | null;
  resolve: ((value: boolean) => void) | null;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmationDialogService {
  private dialogState = signal<DialogState>({
    visible: false,
    config: null,
    resolve: null,
  });

  readonly state = this.dialogState.asReadonly();

  async confirm(config: ConfirmationDialogConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this.dialogState.set({
        visible: true,
        config: {
          confirmText: 'Bestätigen',
          cancelText: 'Abbrechen',
          danger: false,
          ...config,
        },
        resolve,
      });
    });
  }

  handleConfirm() {
    const state = this.dialogState();
    if (state.resolve) {
      state.resolve(true);
    }
    this.close();
  }

  handleCancel() {
    const state = this.dialogState();
    if (state.resolve) {
      state.resolve(false);
    }
    this.close();
  }

  private close() {
    this.dialogState.set({
      visible: false,
      config: null,
      resolve: null,
    });
  }
}

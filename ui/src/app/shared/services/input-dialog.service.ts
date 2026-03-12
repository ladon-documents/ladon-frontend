import { Injectable, signal } from '@angular/core';

export interface InputDialogConfig {
  title: string;
  label: string;
  placeholder?: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

interface InputDialogState {
  visible: boolean;
  config: InputDialogConfig | null;
  value: string;
  showError: boolean;
  isProcessing: boolean;
  resolve: ((value: string | null) => void) | null;
}

@Injectable({
  providedIn: 'root',
})
export class InputDialogService {
  private dialogState = signal<InputDialogState>({
    visible: false,
    config: null,
    value: '',
    showError: false,
    isProcessing: false,
    resolve: null,
  });

  readonly state = this.dialogState.asReadonly();

  async prompt(config: InputDialogConfig): Promise<string | null> {
    return new Promise((resolve) => {
      this.dialogState.set({
        visible: true,
        config: {
          confirmText: 'Erstellen',
          cancelText: 'Abbrechen',
          placeholder: '',
          errorMessage: 'Ungültige Eingabe',
          ...config,
        },
        value: '',
        showError: false,
        isProcessing: false,
        resolve,
      });
    });
  }

  updateValue(value: string): void {
    this.dialogState.update((state) => ({
      ...state,
      value,
      showError: false,
    }));
  }

  setProcessing(isProcessing: boolean): void {
    this.dialogState.update((state) => ({
      ...state,
      isProcessing,
    }));
  }

  handleConfirm(): void {
    const state = this.dialogState();
    const value = state.value.trim();

    if (!value) {
      this.dialogState.update((s) => ({ ...s, showError: true }));
      return;
    }

    if (state.config?.validator && !state.config.validator(value)) {
      this.dialogState.update((s) => ({ ...s, showError: true }));
      return;
    }

    if (state.resolve) {
      state.resolve(value);
    }
    this.close();
  }

  handleCancel(): void {
    const state = this.dialogState();
    if (state.resolve) {
      state.resolve(null);
    }
    this.close();
  }

  private close(): void {
    this.dialogState.set({
      visible: false,
      config: null,
      value: '',
      showError: false,
      isProcessing: false,
      resolve: null,
    });
  }
}

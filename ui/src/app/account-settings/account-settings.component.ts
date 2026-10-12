import { Clipboard } from '@angular/cdk/clipboard';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import type { FetchApiError } from '../services/api/fetch-api.factory';
import { TwoFactorService } from '../services/two-factor.service';
import { AppStore } from '../store/app.store';

type SetupStep = 'start' | 'loading' | 'verify' | 'backup' | 'complete';

const QR_ERROR_FALLBACK = 'QR-Code konnte nicht geladen werden. Bitte erneut versuchen.';
const CONFIRM_ERROR_FALLBACK = '2FA konnte nicht aktiviert werden. Bitte erneut versuchen.';
const DOWNLOAD_FILENAME = 'ladon-2fa-backup-codes.txt';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './account-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettingsComponent implements OnDestroy {
  readonly step = signal<SetupStep>('start');
  readonly errorMessage = signal<string | null>(null);
  readonly qrCodeUrl = signal<string | null>(null);
  readonly backupCodes = signal<readonly string[]>([]);
  readonly backupDownloadUrl = signal<string | null>(null);
  readonly copySucceeded = signal<boolean | null>(null);
  readonly isConfirming = signal(false);

  readonly #twoFactorService = inject(TwoFactorService);
  readonly #clipboard = inject(Clipboard);
  readonly #store = inject(AppStore);
  readonly #router = inject(Router);
  readonly #destroyRef = inject(DestroyRef);
  readonly #formBuilder = inject(NonNullableFormBuilder);

  readonly verificationForm = this.#formBuilder.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });
  readonly savedSafelyForm = this.#formBuilder.group({
    savedSafely: [false, Validators.requiredTrue],
  });

  #operationGeneration = 0;
  #destroyed = false;

  startSetup(): void {
    if (this.#destroyed || this.step() === 'loading' || this.isConfirming()) {
      return;
    }

    const operation = this.#beginOperation();
    this.#clearSensitiveState();
    this.errorMessage.set(null);
    this.step.set('loading');

    this.#twoFactorService
      .loadSetupQrCode()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (qrCode) => {
          if (!this.#isCurrentOperation(operation)) {
            return;
          }

          this.#replaceQrCodeUrl(URL.createObjectURL(qrCode));
          this.step.set('verify');
        },
        error: (error: unknown) => {
          if (!this.#isCurrentOperation(operation)) {
            return;
          }

          if (this.#isFetchApiError(error) && error.status === 401) {
            this.#requireReauthentication();
            return;
          }

          this.errorMessage.set(this.#normalizeError(error, QR_ERROR_FALLBACK));
          this.step.set('start');
        },
      });
  }

  confirmSetup(): void {
    if (this.#destroyed || this.isConfirming()) {
      return;
    }

    if (this.verificationForm.invalid || this.step() !== 'verify') {
      this.verificationForm.markAllAsTouched();
      return;
    }

    const operation = this.#beginOperation();
    this.isConfirming.set(true);
    this.errorMessage.set(null);
    const code = this.verificationForm.controls.code.value;
    this.#twoFactorService
      .confirm(code)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (response) => {
          if (!this.#isCurrentOperation(operation)) {
            return;
          }

          this.isConfirming.set(false);
          const rawResponse: unknown = response;
          if (typeof rawResponse !== 'object' || rawResponse === null) {
            this.#handleInvalidConfirmationResponse();
            return;
          }

          const candidate = rawResponse as { success?: unknown; backupCodes?: unknown };
          const rawCodes = candidate.backupCodes;
          if (
            candidate.success !== true ||
            !Array.isArray(rawCodes) ||
            rawCodes.length === 0 ||
            !rawCodes.every(
              (backupCode): backupCode is string => typeof backupCode === 'string' && backupCode.trim().length > 0,
            )
          ) {
            this.#handleInvalidConfirmationResponse();
            return;
          }

          const codes = rawCodes.map((backupCode) => backupCode.trim());
          this.backupCodes.set(codes);
          this.copySucceeded.set(null);
          this.savedSafelyForm.reset();
          this.#replaceBackupDownloadUrl(URL.createObjectURL(this.#createBackupCodesBlob(codes)));
          this.step.set('backup');
        },
        error: (error: unknown) => {
          if (!this.#isCurrentOperation(operation)) {
            return;
          }

          this.isConfirming.set(false);
          this.#handleConfirmationError(error);
        },
      });
  }

  copyBackupCodes(): void {
    if (this.backupCodes().length === 0) {
      this.copySucceeded.set(false);
      return;
    }

    this.copySucceeded.set(this.#clipboard.copy(this.backupCodes().join('\n')));
  }

  cancelSetup(): void {
    if (this.#destroyed || this.isConfirming()) {
      return;
    }

    this.#invalidateOperations();
    this.#clearSensitiveState();
    this.errorMessage.set(null);
    this.step.set('start');
  }

  acknowledgeBackupCodes(): void {
    if (this.savedSafelyForm.invalid || this.step() !== 'backup') {
      this.savedSafelyForm.markAllAsTouched();
      return;
    }

    this.#invalidateOperations();
    this.#clearSensitiveState();
    this.errorMessage.set(null);
    this.step.set('complete');
  }

  ngOnDestroy(): void {
    this.#destroyed = true;
    this.#invalidateOperations();
    this.isConfirming.set(false);
    this.#clearSensitiveState();
    this.errorMessage.set(null);
  }

  #handleInvalidConfirmationResponse(): void {
    this.verificationForm.controls.code.setValue('');
    this.savedSafelyForm.reset();
    this.backupCodes.set([]);
    this.copySucceeded.set(null);
    this.#clearBackupDownloadUrl();
    this.errorMessage.set(CONFIRM_ERROR_FALLBACK);
    this.step.set('verify');
  }

  #handleConfirmationError(error: unknown): void {
    if (this.#isFetchApiError(error) && error.status === 401) {
      this.#requireReauthentication();
      return;
    }

    if (this.#isFetchApiError(error) && error.status === 400) {
      this.verificationForm.controls.code.setValue('');
      this.step.set('verify');
    }

    this.errorMessage.set(this.#normalizeError(error, CONFIRM_ERROR_FALLBACK));
  }

  #requireReauthentication(): void {
    this.#invalidateOperations();
    this.isConfirming.set(false);
    this.#clearSensitiveState();
    this.errorMessage.set(null);
    this.step.set('start');
    this.#store.requireReauthentication(this.#router.url);
  }

  #clearSensitiveState(): void {
    this.verificationForm.reset();
    this.savedSafelyForm.reset();
    this.backupCodes.set([]);
    this.copySucceeded.set(null);
    this.#clearBackupDownloadUrl();
    this.#clearQrCodeUrl();
  }

  #beginOperation(): number {
    return ++this.#operationGeneration;
  }

  #invalidateOperations(): void {
    this.#operationGeneration++;
  }

  #isCurrentOperation(operation: number): boolean {
    return !this.#destroyed && operation === this.#operationGeneration;
  }

  #createBackupCodesBlob(codes: readonly string[]): Blob {
    return new Blob([`Ladon 2FA Backup-Codes\n\n${codes.join('\n')}\n`], { type: 'text/plain;charset=utf-8' });
  }

  #replaceQrCodeUrl(url: string): void {
    this.#clearQrCodeUrl();
    this.qrCodeUrl.set(url);
  }

  #replaceBackupDownloadUrl(url: string): void {
    this.#clearBackupDownloadUrl();
    this.backupDownloadUrl.set(url);
  }

  #clearQrCodeUrl(): void {
    this.#revokeObjectUrl(this.qrCodeUrl());
    this.qrCodeUrl.set(null);
  }

  #clearBackupDownloadUrl(): void {
    this.#revokeObjectUrl(this.backupDownloadUrl());
    this.backupDownloadUrl.set(null);
  }

  #revokeObjectUrl(url: string | null): void {
    if (url !== null) {
      URL.revokeObjectURL(url);
    }
  }

  #normalizeError(error: unknown, fallback: string): string {
    if (!this.#isFetchApiError(error)) {
      return fallback;
    }

    return error.error.reason.trim() || error.message.trim() || fallback;
  }

  #isFetchApiError(error: unknown): error is FetchApiError {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const candidate = error as Partial<FetchApiError>;
    return (
      typeof candidate.status === 'number' &&
      typeof candidate.message === 'string' &&
      typeof candidate.error === 'object' &&
      candidate.error !== null &&
      typeof candidate.error.reason === 'string'
    );
  }

  protected readonly downloadFilename = DOWNLOAD_FILENAME;
}

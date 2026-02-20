import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationDialogService } from '../../services/confirmation-dialog.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroExclamationTriangle } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, NgIcon],
  providers: [
    provideIcons({
      heroExclamationTriangle,
    }),
  ],
  template: `
    @if (dialogService.state().visible) {
      <div class="fixed inset-0 z-[9998] overflow-y-auto">
        <div
          class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          (click)="dialogService.handleCancel()"></div>

        <div class="relative min-h-screen flex items-center justify-center p-4">
          <div class="relative bg-base-100 rounded-lg shadow-xl w-full max-w-md" (click)="$event.stopPropagation()">
            <div class="p-6">
              <div class="flex items-start gap-4">
                @if (dialogService.state().config?.danger) {
                  <div class="flex-shrink-0">
                    <ng-icon name="heroExclamationTriangle" size="2em" class="text-error"> </ng-icon>
                  </div>
                }
                <div class="flex-1">
                  <h3 class="text-lg font-semibold mb-2">
                    {{ dialogService.state().config?.title }}
                  </h3>
                  <p class="text-sm text-base-content/70">
                    {{ dialogService.state().config?.message }}
                  </p>
                </div>
              </div>

              <div class="flex justify-end gap-3 mt-6">
                <button class="btn btn-ghost" (click)="dialogService.handleCancel()">
                  {{ dialogService.state().config?.cancelText }}
                </button>
                <button
                  class="btn"
                  [class.btn-error]="dialogService.state().config?.danger"
                  [class.btn-primary]="!dialogService.state().config?.danger"
                  (click)="dialogService.handleConfirm()">
                  {{ dialogService.state().config?.confirmText }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
})
export class ConfirmationDialogComponent {
  readonly dialogService = inject(ConfirmationDialogService);

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.dialogService.state().visible) {
      this.dialogService.handleCancel();
    }
  }
}

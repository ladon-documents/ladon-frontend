import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroCheckCircle,
  heroXCircle,
  heroExclamationTriangle,
  heroInformationCircle,
  heroXMark,
} from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, NgIcon],
  providers: [
    provideIcons({
      heroCheckCircle,
      heroXCircle,
      heroExclamationTriangle,
      heroInformationCircle,
      heroXMark,
    }),
  ],
  template: `
    <div class="toast toast-top toast-end z-[9999]">
      @for (toast of toastService.toastList(); track toast.id) {
        <div
          class="alert shadow-lg min-w-64 max-w-md"
          [class.alert-success]="toast.type === 'success'"
          [class.alert-error]="toast.type === 'error'"
          [class.alert-warning]="toast.type === 'warning'"
          [class.alert-info]="toast.type === 'info'">
          <ng-icon [name]="getIcon(toast.type)" size="1.5em"> </ng-icon>
          <span class="flex-1">{{ toast.message }}</span>
          <button class="btn btn-ghost btn-xs btn-square" (click)="toastService.remove(toast.id)">
            <ng-icon name="heroXMark" size="1em"></ng-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  getIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'heroCheckCircle';
      case 'error':
        return 'heroXCircle';
      case 'warning':
        return 'heroExclamationTriangle';
      case 'info':
        return 'heroInformationCircle';
      default:
        return 'heroInformationCircle';
    }
  }
}

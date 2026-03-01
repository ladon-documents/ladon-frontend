import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextMenuService } from '../../services/context-menu.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroPencilSquare,
  heroDocumentDuplicate,
  heroArrowRightOnRectangle,
  heroTrash,
  heroInformationCircle,
  heroLink,
  heroStar,
} from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-context-menu',
  standalone: true,
  imports: [CommonModule, NgIcon],
  providers: [
    provideIcons({
      heroPencilSquare,
      heroDocumentDuplicate,
      heroArrowRightOnRectangle,
      heroTrash,
      heroInformationCircle,
      heroLink,
      heroStar,
    }),
  ],
  template: `
    @if (contextMenuService.state().visible) {
      <div
        class="fixed bg-base-100 rounded-lg shadow-xl border border-gray-500/40 py-1 z-50 min-w-48"
        [style.left.px]="contextMenuService.state().x"
        [style.top.px]="contextMenuService.state().y"
        (click)="$event.stopPropagation()">
        @for (item of contextMenuService.state().items; track item.label) {
          @if (item.divider) {
            <div class="divider my-1"></div>
          } @else {
            <button
              class="w-full px-4 py-2 text-left hover:bg-base-200 flex items-center gap-3 transition-colors disabled:opacity-50"
              [class.text-error]="item.danger"
              [disabled]="item.disabled"
              (click)="handleClick(item)">
              <ng-icon [name]="item.icon" size="1.2em"></ng-icon>
              <span class="text-sm">{{ item.label }}</span>
            </button>
          }
        }
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
export class ContextMenuComponent {
  readonly contextMenuService = inject(ContextMenuService);

  @HostListener('document:click')
  onDocumentClick() {
    this.contextMenuService.hide();
  }

  @HostListener('document:contextmenu')
  onDocumentContextMenu() {
    return true;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.contextMenuService.hide();
  }

  handleClick(item: any) {
    if (!item.disabled) {
      item.action();
      this.contextMenuService.hide();
    }
  }
}

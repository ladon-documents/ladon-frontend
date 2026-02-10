
import { Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarService } from './sidebar.service';

@Component({
  selector: 'sidebar-resizer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      #resizerHandle
      class="resizer-handle"
      (mousedown)="startResize($event)"
      [class.resizing]="isResizing">
    </div>
  `,
  styles: [`
    .resizer-handle {
      width: 4px;
      height: 100%;
      background: transparent;
      cursor: col-resize;
      position: absolute;
      left: 0;
      top: 0;
      z-index: 10;
      transition: background-color 0.2s ease;
    }

    .resizer-handle:hover,
    .resizer-handle.resizing {
      background-color: #3b82f6;
    }

    .resizer-handle::before {
      content: '';
      position: absolute;
      left: -2px;
      top: 0;
      width: 8px;
      height: 100%;
    }

    /* Während des Resizings alle Transitionen deaktivieren */
    :host(.resizing) * {
      transition: none !important;
    }
  `]
})
export class SidebarResizerComponent implements OnDestroy {
  @ViewChild('resizerHandle', { static: true }) resizerHandle!: ElementRef;

  isResizing = false;
  private sidebarService = inject(SidebarService);
  private startX = 0;
  private startWidth = 0;
  private rafId: number | null = null;

  startResize(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing = true;
    this.startX = event.clientX;
    this.startWidth = this.sidebarService.width();

    document.body.classList.add('resizing-sidebar');

    document.addEventListener('mousemove', this.onMouseMove, { passive: false });
    document.addEventListener('mouseup', this.onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  private onMouseMove = (event: MouseEvent): void => {
    if (!this.isResizing) return;

    event.preventDefault();

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = requestAnimationFrame(() => {
      const deltaX = this.startX - event.clientX;
      const newWidth = this.startWidth + deltaX;

      const minWidth = 200;
      const maxWidth = 600;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

      this.sidebarService.setWidth(clampedWidth);
    });
  };

  private onMouseUp = (): void => {
    this.isResizing = false;

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    document.body.classList.remove('resizing-sidebar');

    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  ngOnDestroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.body.classList.remove('resizing-sidebar');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
}

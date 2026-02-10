import { Injectable, signal } from '@angular/core';

export type SidebarMode = 'preview' | 'clipboard';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private _isOpen = signal(false);
  private _mode = signal<SidebarMode>('preview');
  private _width = signal(384);
  private _minWidth = 300;
  private _maxWidth = 800;

  isOpen = this._isOpen.asReadonly();
  mode = this._mode.asReadonly();
  width = this._width.asReadonly();


  get minWidth() {
    return this._minWidth;
  }

  get maxWidth() {
    return this._maxWidth;
  }


  toggleSidebar() {
    this._isOpen.update(isOpen => !isOpen);
  }

  openSidebar() {
    this._isOpen.set(true);
  }

  closeSidebar() {
    this._isOpen.set(false);
  }

  toggleClipboardMode() {
    if (this.mode() === 'clipboard') {
      this.toggleSidebar();
    } else {
      this._mode.set('clipboard');
      this.openSidebar();
    }
  }

  togglePreviewMode() {
    if (this.mode() === 'preview') {
      this.toggleSidebar();
    } else {
      this._mode.set('preview');
      this.openSidebar();
    }
  }
  setWidth(width: number) {
    const clampedWidth = Math.min(Math.max(width, this._minWidth), this._maxWidth);
    this._width.set(clampedWidth);
  }

}

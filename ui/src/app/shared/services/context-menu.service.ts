import { Injectable, signal } from '@angular/core';

export interface ContextMenuItem {
  label: string;
  icon: string;
  action: () => void;
  divider?: boolean;
  disabled?: boolean;
  danger?: boolean;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}

@Injectable({
  providedIn: 'root',
})
export class ContextMenuService {
  private menuState = signal<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    items: [],
  });

  readonly state = this.menuState.asReadonly();

  show(x: number, y: number, items: ContextMenuItem[]) {
    // Adjust position to keep menu on screen
    const menuWidth = 200;
    const menuHeight = items.length * 40;
    const adjustedX = Math.min(x, window.innerWidth - menuWidth);
    const adjustedY = Math.min(y, window.innerHeight - menuHeight);

    this.menuState.set({
      visible: true,
      x: adjustedX,
      y: adjustedY,
      items,
    });
  }

  hide() {
    this.menuState.update((state) => ({ ...state, visible: false }));
  }
}

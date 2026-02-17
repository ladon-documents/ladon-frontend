// clipboard.service.ts
import { Injectable, Signal, signal } from '@angular/core';
import { CdkDropList } from '@angular/cdk/drag-drop';

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {
  private clipboardListRef = signal<CdkDropList | any>(null);
  readonly clipboardList = this.clipboardListRef.asReadonly();

  setClipboardList(ref: CdkDropList): void {
    this.clipboardListRef.set(ref);
  }
}

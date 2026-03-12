// clipboard.service.ts
import { Injectable, Signal, signal } from '@angular/core';
import { CdkDropList } from '@angular/cdk/drag-drop';

@Injectable({
  providedIn: 'root',
})
export class ClipboardService {
  private clipboardListRef = signal<CdkDropList | any>(null);
  private originListRef = signal<CdkDropList | any>(null);
  readonly clipboardList = this.clipboardListRef.asReadonly();
  readonly originList = this.originListRef.asReadonly();

  setClipboardList(ref: CdkDropList): void {
    this.clipboardListRef.set(ref);
  }

  setOriginList(ref: CdkDropList): void {
    this.originListRef.set(ref);
  }
}

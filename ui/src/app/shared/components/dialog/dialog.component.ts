import { Component, input, ViewChild, ElementRef, output, HostListener } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent {
  closeEmit = output<void>();
  @ViewChild('dialog', { static: true }) dialog: ElementRef | undefined;

  title = input<string>();

  openDialog(): void {
    this.dialog?.nativeElement.showModal();
  }

  closeDialog(): void {
    this.closeEmit.emit();
    this.dialog?.nativeElement.close();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: KeyboardEvent): void {
    const dialogCmp = this.dialog?.nativeElement;
    if (dialogCmp && dialogCmp.open) {
      this.closeEmit.emit();
    }
  }
}

import { Component, input, ViewChild, ElementRef } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent {
  @ViewChild('dialog', { static: true }) dialog: ElementRef | undefined;

  title = input<string>();

  openDialog(): void {
    this.dialog?.nativeElement.showModal();
  }

  closeDialog(): void {
    this.dialog?.nativeElement.close();
  }
}

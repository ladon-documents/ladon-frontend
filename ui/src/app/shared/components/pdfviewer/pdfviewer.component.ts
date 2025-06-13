import { Component } from '@angular/core';
import { DialogComponent } from '@ladon/shared';

@Component({
  selector: 'app-pdfviewer',
  imports: [DialogComponent],
  templateUrl: './pdfviewer.component.html',
  styleUrl: './pdfviewer.component.scss',
  standalone: true,
})
export class PdfviewerComponent {}

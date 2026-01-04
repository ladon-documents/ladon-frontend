import { Component, computed, input } from '@angular/core';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'lib-uploads',
  imports: [SpinnerComponent],
  templateUrl: './uploads.component.html',
  styleUrl: './uploads.component.scss',
})
export class UploadsComponent {
  hasActiveUploads = computed(() => (this.uploads() ?? []).length > 0);
  uploads = input<string[]>();
}

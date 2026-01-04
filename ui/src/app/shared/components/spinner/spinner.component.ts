import { Component, input } from '@angular/core';

@Component({
  selector: 'lib-spinner',
  template: `<span class="loading loading-spinner loading-md text-primary"></span>`,
  styleUrl: './spinner.component.scss',
  host: {
    '[class.absolute]': 'isFullWidthAndHeight()',
  },
})
export class SpinnerComponent {
  isFullWidthAndHeight = input<boolean>(true);
}

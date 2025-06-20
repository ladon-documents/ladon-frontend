import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
})
export class FilterComponent {
  placeholder = input<string>('Filtern');
  outputTerm = output<string>();

  onKeyUp(value: string) {
    this.outputTerm.emit(value);
  }
}

import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { NgIconComponent } from '@ng-icons/core';

@Component({
  selector: 'app-pill',
  imports: [NgIconComponent, CommonModule],
  templateUrl: './pill.component.html',
  styles: `
    :host {
      display: inline-flex;
    }
  `,
})
export class PillComponent {
  pillClasses = computed(() => {
    const baseClasses = this.class() || '';
    const typeClass = this.isDeletable() ? 'btn' : 'badge';
    return `${baseClasses} ${typeClass}`.trim();
  });
  label = input<string>();
  isDeletable = input<boolean>(true);
  class = input<string>();

  labelEmit = output<string | undefined>();
  deleteEmit = output<void>();

  onDelete() {
    this.deleteEmit.emit();
  }

  onLabelEmit() {
    this.labelEmit.emit(this.label());
  }
}

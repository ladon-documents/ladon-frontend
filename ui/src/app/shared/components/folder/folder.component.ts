import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-folder',
  imports: [],
  templateUrl: './folder.component.html',
  styleUrl: './folder.component.scss'
})
export class FolderComponent {
  fillColor = computed(() => {
    return `hsl(${this.hue()} ${this.saturation}% ${this.lightness}%)`;
  })

  fillColor45L = computed(() => {
    return `hsl(${this.hue()} ${this.saturation}% ${this.lightness - 5}%)`;
  })

  fillColor100S = computed(() => {
    return `hsl(${this.hue()} ${this.saturation + 10}% ${this.lightness}%)`;
  })


  hue = input<number>(35);
  private readonly saturation = 80;
  private readonly lightness = 50;
}

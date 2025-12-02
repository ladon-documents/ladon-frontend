import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-folder',
  imports: [],
  templateUrl: './folder.component.html',
  styleUrl: './folder.component.scss',
})
export class FolderComponent {
  fillColor = computed(() => `hsl(${this.hue()} ${this.saturation}% ${this.lightness}%)`);
  fillColor30L = computed(() => `hsl(${this.hue()} ${this.saturation}% ${this.lightness - 20}%)`);
  fillColor60L = computed(() => `hsl(${this.hue()} ${this.saturation}% ${this.lightness + 15}%)`);
  hue = input<string>(window.getComputedStyle(document.body).getPropertyValue('--primary-hue').trim() || '212');
  private readonly saturation = 80;
  private readonly lightness = 50;
}

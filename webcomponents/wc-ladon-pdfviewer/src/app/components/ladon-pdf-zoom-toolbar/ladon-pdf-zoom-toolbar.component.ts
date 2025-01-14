import {Component, OnInit, ViewChild} from '@angular/core';
import {BrowserModule} from "@angular/platform-browser";
import {CommonModule} from "@angular/common";

interface ZoomLevel {
  id: string;
  dataL10nId: string;
  dataL10nArgs: string | undefined;
  value: string;
  displayValue: string;
}

@Component({
  standalone: true,
  imports:[CommonModule],
  selector: 'app-ladon-pdf-zoom-toolbar',
  templateUrl: './ladon-pdf-zoom-toolbar.component.html',
  styleUrls: ['./ladon-pdf-zoom-toolbar.component.scss']
})
export class LadonPdfZoomToolbarComponent implements OnInit {
  public zoomLevels: Array<ZoomLevel> = [];

  @ViewChild('sizeSelector') sizeSelector: any;

  constructor() {
    const levels = ['auto', 'page-actual', 'page-fit', 'page-width', 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
    this.zoomLevels = levels.map((l) => this.valueToZoomLevel(l));
  }

  ngOnInit(): void {
    if (typeof document !== 'undefined') {
      const callback = (e: any) => {
        document.removeEventListener('localized', callback);
      };

      document.addEventListener('localized', callback);
    }
  }

  private valueToZoomLevel(value: string | number): ZoomLevel {
    if (value.toString().endsWith('%')) {
      value = value.toString().replace('%', '');
      value = Number(value) / 100;
    }
    const numericalValue = Number(value);
    if (!numericalValue) {
      const v = String(value);
      return {
        id: this.snakeToCamel(value + 'Option'),
        value: v,
        dataL10nId: 'page_scale_' + v.replace('page-', ''),
        dataL10nArgs: undefined,
        displayValue: v,
      };
    }
    const percentage = Math.round(numericalValue * 100);
    return {
      id: `scale_${percentage}`,
      value: String(numericalValue),
      dataL10nId: 'page_scale_percent',
      dataL10nArgs: `{ "scale": ${percentage} }`,
      displayValue: String(percentage) + '%',
    };
  }

  private snakeToCamel(str: string): any {
    // idea found here: https://hisk.io/javascript-snake-to-camel/
    return str.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace('-', '').replace('_', ''));
  }

}

import { Component, inject, Signal } from '@angular/core';
import { BreadcrumbStore } from '../../store/breadcrumb.store';
import { Document } from '@ladon/api';
import { FilemanagerFacade } from '../filemanager.facade';

@Component({
  standalone: true,
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
})
export class BreadcrumbComponent {
  readonly store = inject(BreadcrumbStore);
  readonly filemanagerFacade = inject(FilemanagerFacade);
  readonly selectedBucket: Signal<string | null> = this.filemanagerFacade.selectedBucket;

  public breadcrumbSignal: Signal<Document[]>;

  constructor() {
    this.breadcrumbSignal = this.store.paths;
  }

  onNavigate(index: number): void {
    const breadcrumbItems = this.breadcrumbSignal();
    if (index === breadcrumbItems.length - 1) {
      return;
    }
    this.filemanagerFacade.navigateBreadcrumb(index);
  }

  showRoot() {
    this.filemanagerFacade.showRoot();
  }
}

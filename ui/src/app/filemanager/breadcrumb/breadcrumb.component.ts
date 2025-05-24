import { Component, inject, Signal } from '@angular/core';
import { FilemanagerStore } from '../../store/filemanager.store';
import { BreadcrumbStore } from '../../store/breadcrumb.store';
import { DocumentModel } from '../../../api';

@Component({
  selector: 'app-breadcrumb',
  imports: [],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent {
  readonly store = inject(BreadcrumbStore);
  public breadcrumbSignal: Signal<DocumentModel[]>;

  constructor() {
    this.breadcrumbSignal = this.store.paths;
  }

}

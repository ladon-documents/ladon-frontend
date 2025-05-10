import { Component, inject, OnDestroy, Signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FilemanagerFacade } from '../filemanager.facade';
import { FilemanagerStore } from '../../store/filemanager.store';
import { CommonModule } from '@angular/common';
import { DocumentModel } from '../../../api';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroArrowDownTray,
  heroDocumentDuplicate,
  heroFolder,
  heroPencilSquare,
  heroPhoto,
  heroPlusCircle,
  heroShare,
  heroStar,
  heroTrash,
} from '@ng-icons/heroicons/outline';
import { heroFolderSolid } from '@ng-icons/heroicons/solid';
import { FilesizePipe } from '../../shared/pipes/filesize.pipe';
import { FileiconPipe } from '../../shared/pipes/fileicon.pipe';

@Component({
  selector: 'app-filemanager-content',
  imports: [CommonModule, NgIcon, FilesizePipe, FileiconPipe],
  providers: [
    provideIcons({
      heroFolder,
      heroPlusCircle,
      heroFolderSolid,
      heroPhoto,
      heroStar,
      heroTrash,
      heroPencilSquare,
      heroArrowDownTray,
      heroDocumentDuplicate,
      heroShare,
    }),
    FilesizePipe,
  ],
  templateUrl: './filemanager-content.component.html',
  styleUrl: './filemanager-content.component.scss',
})
export class FilemanagerContentComponent implements OnDestroy {
  public dateFormat = 'dd.MM.yyyy';
  public breadcrumb: Array<any> = [];
  readonly #store = inject(FilemanagerStore);
  documents: Signal<DocumentModel[]> = this.#store.documents;
  readonly #currentBucket: string | null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.#currentBucket = this.route.snapshot.paramMap.get('bucket');
    this.breadcrumb.push(this.#currentBucket);
    this.showRoot();
  }

  ngOnDestroy(): void {
    this.breadcrumb = [];
  }

  public showRoot() {
    if (this.#currentBucket) {
      this.#store.loadBucket(this.#currentBucket);
    }
  }
}

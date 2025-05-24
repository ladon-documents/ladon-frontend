import { Component, inject, OnDestroy, Signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FilemanagerStore } from '../../store/filemanager.store';
import {CommonModule, NgOptimizedImage} from '@angular/common';
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
import { LadonRouterService } from '../../services/ladon-router.service';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-filemanager-content',
  imports: [CommonModule, NgIcon, FilesizePipe, FileiconPipe, NgOptimizedImage, BreadcrumbComponent],
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
  readonly #store = inject(FilemanagerStore);
  documents: Signal<DocumentModel[]> = this.#store.documents;
  readonly #currentBucket: string | null;
  #selectedDocument: DocumentModel | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ladonRouterService: LadonRouterService,
  ) {
    this.#currentBucket = this.route.snapshot.paramMap.get('bucket');
    //  this.#selectedCurrentFolder = this.route.snapshot.paramMap.get('subfolders');

    if (this.#currentBucket) {
      this.showRoot();
    }
  }

  ngOnInit() {
    // Kombinierte Parameter-Beobachtung
    this.route.params.subscribe((params) => {
      console.log('Bucket:', params['bucket']);
      console.log('Subfolders:', params['subfolders']);
    });
  }

  ngOnDestroy(): void {}

  public showRoot() {
    if (this.#currentBucket) {
      this.#store.loadBucket(this.#currentBucket);
    }
  }

  private showFolders() {
    if (this.#selectedDocument) {
      this.#store.loadDocumentList(this.#selectedDocument);
    }
  }

  async navigateTo(document: DocumentModel) {
    if (!document) return;
    if (document.isFolder && this.#currentBucket && document.key) {
      console.log(document);
      this.#selectedDocument = document;
      this.#store.loadDocumentList(this.#selectedDocument);
      //  await this.ladonRouterService.navigateToFolder(this.#currentBucket, document.key);
    }
  }
}

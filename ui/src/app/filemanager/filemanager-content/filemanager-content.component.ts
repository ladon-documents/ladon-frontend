import { Component, inject, OnDestroy, OnInit, Signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import { LadonRouterService } from '../../services/ladon-router.service';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { FilemanagerFacade } from '../filemanager.facade';
import { ConverterService } from '../../services/converter.service';
import { SidebarService } from '../sidebar/sidebar.service';

@Component({
  standalone: true,
  selector: 'app-filemanager-content',
  imports: [CommonModule, NgIcon, FilesizePipe, FileiconPipe, BreadcrumbComponent],
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
export class FilemanagerContentComponent implements OnDestroy, OnInit {
  public dateFormat = 'dd.MM.yyyy';
  readonly #facade = inject(FilemanagerFacade);
  private readonly converterService = inject(ConverterService);
  private readonly sidebarService = inject(SidebarService);
  documents: Signal<DocumentModel[]> = this.#facade.documents;
  #currentBucket: string | null = null;
  #subfolder: string | null = null;
  #selectedDocument: DocumentModel | null = null;

  imageUrl: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ladonRouterService: LadonRouterService,
  ) {}

  ngOnInit() {
    this.route.data.subscribe((data) => {
      this.#currentBucket = data['bucket'];
    });

    this.route.params.subscribe((params) => {
      console.log('Bucket:', params['bucket']);
      console.log('Subfolders:', params['subfolders']);
      //    this.#currentBucket = params['bucket'];
      this.#subfolder = params['subfolders'];
      if (this.#currentBucket && !this.#subfolder) {
        //   this.showRoot();
      } else if (this.#currentBucket && this.#subfolder) {
        console.log(this.#subfolder);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl);
    }
  }

  public showRoot() {
    if (this.#currentBucket) {
      this.#facade.initRoot();
    }
  }

  onImageError(event: any) {
    console.error('Fehler beim Anzeigen des Bildes:', event);
    this.imageUrl = null;
  }

  async select(document: DocumentModel) {
    this.#facade.setSelectedDocument(document);
  }

  async navigateTo(document: DocumentModel) {
    if (!document) return;
    if (document.isFolder) {
      this.#selectedDocument = document;
      this.#facade.load(this.#selectedDocument);
    } else {
      await this.select(document);
    }
  }
}

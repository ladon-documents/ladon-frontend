import { Component, inject, OnInit, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { SearchbarComponent } from '../searchbar/searchbar.component';
import { filemanagerRoutes } from './filemanager.routes';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FilemanagerFacade } from './filemanager.facade';
import { FilemanagerStore } from '../store/filemanager.store';
import { SidebarComponent } from './sidebar/sidebar.component';
import { heroDocument, heroFolder, heroPlus } from '@ng-icons/heroicons/outline';
import { FilesizePipe } from '../shared/pipes/filesize.pipe';
import { BucketStatsExtended } from '../interfaces/bucket-stats';

@Component({
  standalone: true,
  selector: 'filemanager',
  imports: [CommonModule, RouterModule, NgIconComponent],
  providers: [
    provideIcons({
      heroPlus,
      heroDocument,
      heroFolder,
    }),
    FilesizePipe,
  ],
  templateUrl: './filemanager.component.html',
  styleUrl: './filemanager.component.scss',
})
export class FilemanagerComponent implements OnInit {
  readonly #facade = inject(FilemanagerFacade);
  readonly selectedBucket: Signal<string | null> = this.#facade.selectedBucket;
  readonly stats: Signal<BucketStatsExtended | null> = this.#facade.statistics;
  constructor(
    private router: Router,
    private route: ActivatedRoute) {}

  ngOnInit() {
    if (this.selectedBucket()) {
      this.#facade.loadStats();
      this.router.navigate([this.selectedBucket()], { relativeTo: this.route });
    }
  }

  protected readonly heroDocument = heroDocument;
  protected readonly heroFolder = heroFolder;
}

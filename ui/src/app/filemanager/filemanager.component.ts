import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { SearchbarComponent } from '../searchbar/searchbar.component';
import { filemanagerRoutes } from './filemanager.routes';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FilemanagerFacade } from './filemanager.facade';
import { FilemanagerStore } from '../store/filemanager.store';
import { SidebarComponent } from './sidebar/sidebar.component';
import { heroPlus } from '@ng-icons/heroicons/outline';
import { FilesizePipe } from '../shared/pipes/filesize.pipe';

@Component({
  selector: 'filemanager',
  imports: [CommonModule, RouterModule, NgIconComponent, SearchbarComponent, SidebarComponent],
  providers: [
    provideIcons({
      heroPlus,
    }),
    FilesizePipe,
  ],
  templateUrl: './filemanager.component.html',
  styleUrl: './filemanager.component.scss',
})
export class FilemanagerComponent {
  readonly #store = inject(FilemanagerStore);
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private filemanagerFadcade: FilemanagerFacade,
  ) {
    const selectedBucket = this.#store.selectedBucket();
    if (selectedBucket) {
      //this.router.navigate([selectedBucket], { relativeTo: this.route });
    }
  }
}

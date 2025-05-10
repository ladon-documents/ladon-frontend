import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowPath, heroDocument, heroFolder, heroPlusCircle, heroStar } from '@ng-icons/heroicons/outline';
import { heroFolderSolid, heroStarSolid, heroTrashSolid } from '@ng-icons/heroicons/solid';

@Component({
  selector: 'app-filemanager-sidebar',
  imports: [CommonModule, NgIcon],
  providers: [
    provideIcons({
      heroFolder,
      heroPlusCircle,
      heroFolderSolid,
      heroTrashSolid,
      heroStarSolid,
      heroStar,
      heroDocument,
      heroArrowPath,
    }),
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {}

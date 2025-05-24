import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowPath, heroDocument, heroFolder, heroPlusCircle, heroStar } from '@ng-icons/heroicons/outline';
import { heroFolderSolid, heroStarSolid, heroTrashSolid } from '@ng-icons/heroicons/solid';

interface FileItem {
  name: string;
  type: 'folder' | 'file';
  isOpen?: boolean;
  children?: FileItem[];
}

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
export class SidebarComponent {
  fileStructure: FileItem[] = [
    {
      name: 'Dokumente',
      type: 'folder',
      isOpen: false,
      children: [
        { name: 'Projekt A', type: 'folder', children: [
            { name: 'Konzept.pdf', type: 'file' },
            { name: 'Budget.xlsx', type: 'file' }
          ]},
        { name: 'Wichtige Notizen.txt', type: 'file' }
      ]
    },
    {
      name: 'Bilder',
      type: 'folder',
      isOpen: false,
      children: [
        { name: 'Urlaub', type: 'folder', children: [
            { name: 'foto1.jpg', type: 'file' },
            { name: 'foto2.jpg', type: 'file' }
          ]}
      ]
    },
    {
      name: 'Downloads',
      type: 'folder',
      isOpen: false,
      children: [
        { name: 'Installation.dmg', type: 'file' },
        { name: 'Handbuch.pdf', type: 'file' }
      ]
    }
  ];

  toggleFolder(item: FileItem) {
    if (item.type === 'folder') {
      item.isOpen = !item.isOpen;
    }
  }

  handleItemClick(item: FileItem) {
    if (item.type === 'folder') {
      this.toggleFolder(item);
    } else {
      // Hier können Sie die Logik zum Öffnen einer Datei implementieren
      console.log(`Öffne Datei: ${item.name}`);
    }
  }

}

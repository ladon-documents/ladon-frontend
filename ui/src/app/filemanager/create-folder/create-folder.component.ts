import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilemanagerFacade } from '../filemanager.facade';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroFolder, heroXMark } from '@ng-icons/heroicons/outline';
import { DialogComponent } from '@ladon/shared';
import { InputDialogService } from '../../shared/services/input-dialog.service';

@Component({
  selector: 'create-folder',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent, DialogComponent],
  providers: [
    provideIcons({
      heroFolder,
      heroXMark,
    }),
  ],
  templateUrl: './create-folder.component.html',
})
export class CreateFolderComponent {
  @ViewChild(DialogComponent, { static: true }) createFolderDialog: DialogComponent | undefined;
  private readonly facade = inject(FilemanagerFacade);
  private readonly inputDialogService = inject(InputDialogService);

  async openModal() {
    const invalidChars = /[<>:"/\\|?*]/g;

    const folderName = await this.inputDialogService.prompt({
      title: 'Neuer Ordner',
      label: 'Ordnername',
      placeholder: 'Mein Ordner',
      icon: 'heroFolder',
      confirmText: 'Ordner erstellen',
      cancelText: 'Abbrechen',
      validator: (value) => !invalidChars.test(value),
      errorMessage: 'Ungültige Zeichen im Ordnernamen (<>:"/\\|?*)',
    });

    if (folderName) {
      try {
        this.inputDialogService.setProcessing(true);
        this.facade.createFolder(folderName);
      } catch (error) {
        console.error('Fehler beim Erstellen des Ordners:', error);
      } finally {
        this.inputDialogService.setProcessing(false);
      }
    }
  }
}

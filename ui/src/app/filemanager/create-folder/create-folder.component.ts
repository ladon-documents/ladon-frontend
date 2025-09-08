import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilemanagerFacade } from '../filemanager.facade';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroFolder, heroXMark } from '@ng-icons/heroicons/outline';
import { DialogComponent } from '@ladon/shared';

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

  isModalOpen = false;
  folderName = '';
  showError = false;
  isCreating = false;

  openModal() {
    this.createFolderDialog?.openDialog();
    this.folderName = '';
    this.showError = false;
    this.isCreating = false;

    // Focus auf Input-Feld nach kurzer Verzögerung
    setTimeout(() => {
      const input = document.getElementById('folderName') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 100);
  }

  closeDialog(): void {
    this.folderName = '';
    this.showError = false;
    this.createFolderDialog?.closeDialog();
  }

  async onSubmit() {
    if (!this.folderName.trim()) {
      this.showError = true;
      return;
    }
    const invalidChars = /[<>:"/\\|?*]/g;
    if (invalidChars.test(this.folderName)) {
      this.showError = true;
      return;
    }
    this.isCreating = true;
    this.showError = false;

    try {
      this.createFolder(this.folderName.trim());

      this.closeDialog();
    } catch (error) {
      console.error('Fehler beim Erstellen des Ordners:', error);
      this.showError = true;
    } finally {
      this.isCreating = false;
    }
  }

  private createFolder(folderName: string) {
    if (!folderName.trim()) {
      return;
    }
    this.facade.createFolder(folderName.trim());
  }
}

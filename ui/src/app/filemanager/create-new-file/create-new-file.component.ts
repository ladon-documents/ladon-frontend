import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { FilemanagerFacade } from '../filemanager.facade';
import { heroDocument, heroXMark } from '@ng-icons/heroicons/outline';
import { InputDialogService } from '../../shared/services/input-dialog.service';

@Component({
  selector: 'create-new-file',
  standalone: true,
  imports: [FormsModule, NgIconComponent],
  providers: [
    provideIcons({
      heroDocument,
      heroXMark,
    }),
  ],
  templateUrl: './create-new-file.component.html',
  styleUrl: './create-new-file.component.scss',
})
export class CreateNewFileComponent {
  private readonly facade = inject(FilemanagerFacade);
  private readonly inputDialogService = inject(InputDialogService);

  async openModal() {
    const invalidChars = /[<>:"/\\|?*]/g;

    const fileName = await this.inputDialogService.prompt({
      title: 'Neue Datei',
      label: 'Dateiname',
      placeholder: 'dokument.txt',
      icon: 'heroDocument',
      confirmText: 'Datei erstellen',
      cancelText: 'Abbrechen',
      validator: (value) => !invalidChars.test(value),
      errorMessage: 'Ungültige Zeichen im Dateinamen (<>:"/\\|?*)',
    });

    if (fileName) {
      try {
        this.inputDialogService.setProcessing(true);
        this.facade.createEmptyFile(fileName);
      } catch (error) {
        console.error('Fehler beim Erstellen der Datei:', error);
      } finally {
        this.inputDialogService.setProcessing(false);
      }
    }
  }
}

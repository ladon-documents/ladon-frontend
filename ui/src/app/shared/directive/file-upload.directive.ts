import { Directive, ElementRef, EventEmitter, HostListener, Input, Output, Renderer2 } from '@angular/core';

export interface FileUploadEvent {
  files: File[];
  event: DragEvent;
}

@Directive({
  selector: '[appFileUpload]',
  standalone: true,
})
export class FileUploadDirective {
  @Input() acceptedTypes: string[] = [];
  @Input() maxFileSize: number = 10 * 1024 * 1024;
  @Input() allowMultiple: boolean = true;
  @Input() dragOverClass: string = 'drag-over';
  @Input() dragActiveClass: string = 'drag-active';

  @Output() filesDropped = new EventEmitter<FileUploadEvent>();
  @Output() filesHovered = new EventEmitter<boolean>();
  @Output() filesRejected = new EventEmitter<{ files: File[]; reasons: string[] }>();

  private dragCounter = 0;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
  ) {}

  @HostListener('dragenter', ['$event'])
  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.dragCounter++;

    if (this.hasFiles(event)) {
      this.renderer.addClass(this.elementRef.nativeElement, this.dragActiveClass);
      this.filesHovered.emit(true);
    }
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.hasFiles(event)) {
      this.renderer.addClass(this.elementRef.nativeElement, this.dragOverClass);

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
    }
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.dragCounter--;

    if (this.dragCounter === 0) {
      this.renderer.removeClass(this.elementRef.nativeElement, this.dragActiveClass);
      this.renderer.removeClass(this.elementRef.nativeElement, this.dragOverClass);
      this.filesHovered.emit(false);
    }
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.dragCounter = 0;
    this.renderer.removeClass(this.elementRef.nativeElement, this.dragActiveClass);
    this.renderer.removeClass(this.elementRef.nativeElement, this.dragOverClass);
    this.filesHovered.emit(false);

    if (!this.hasFiles(event) || !event.dataTransfer) {
      return;
    }

    const files = Array.from(event.dataTransfer.files);

    if (files.length === 0) {
      return;
    }

    const validationResult = this.validateFiles(files);

    if (validationResult.validFiles.length > 0) {
      this.filesDropped.emit({
        files: validationResult.validFiles,
        event,
      });
    }

    if (validationResult.invalidFiles.length > 0) {
      this.filesRejected.emit({
        files: validationResult.invalidFiles,
        reasons: validationResult.rejectionReasons,
      });
    }
  }

  private hasFiles(event: DragEvent): boolean {
    if (!event.dataTransfer) {
      return false;
    }

    return event.dataTransfer.types.includes('Files');
  }

  private validateFiles(files: File[]): {
    validFiles: File[];
    invalidFiles: File[];
    rejectionReasons: string[];
  } {
    const validFiles: File[] = [];
    const invalidFiles: File[] = [];
    const rejectionReasons: string[] = [];

    const filesToProcess = this.allowMultiple ? files : files.slice(0, 1);

    filesToProcess.forEach((file) => {
      const reasons: string[] = [];

      if (file.size > this.maxFileSize) {
        reasons.push(`Datei zu groß (max. ${this.formatFileSize(this.maxFileSize)})`);
      }

      if (this.acceptedTypes.length > 0) {
        const fileType = file.type;
        const fileName = file.name.toLowerCase();

        const isAccepted = this.acceptedTypes.some((acceptedType) => {
          if (acceptedType.includes('/')) {
            return fileType === acceptedType || fileType.startsWith(acceptedType.replace('*', ''));
          }
          if (acceptedType.startsWith('.')) {
            return fileName.endsWith(acceptedType);
          }
          return false;
        });

        if (!isAccepted) {
          reasons.push(`Dateityp nicht erlaubt (erlaubt: ${this.acceptedTypes.join(', ')})`);
        }
      }

      if (reasons.length === 0) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file);
        rejectionReasons.push(`${file.name}: ${reasons.join(', ')}`);
      }
    });

    return { validFiles, invalidFiles, rejectionReasons };
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DocumentModel } from '../../../api';
import { FilemanagerFacade } from '../filemanager.facade';
import { firstValueFrom } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroArrowPath,
  heroArrowUturnLeft,
  heroArrowUturnRight,
  heroCheck,
  heroScissors,
  heroXMark,
} from '@ng-icons/heroicons/outline';

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EditorSnapshot {
  rotation: number;
  brightness: number;
  contrast: number;
  saturate: number;
  grayscale: number;
  sepia: number;
  cropRect: CropRect | null;
}

interface RenderSettings {
  rotation: number;
  brightness: number;
  contrast: number;
  saturate: number;
  grayscale: number;
  sepia: number;
}

type OutputFormat = 'original' | 'png' | 'jpeg' | 'webp';

@Component({
  selector: 'app-image-editor-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  providers: [
    provideIcons({
      heroXMark,
      heroArrowPath,
      heroArrowUturnLeft,
      heroArrowUturnRight,
      heroScissors,
      heroCheck,
    }),
  ],
  templateUrl: './image-editor-dialog.component.html',
  styleUrl: './image-editor-dialog.component.scss',
})
export class ImageEditorDialogComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly filemanagerFacade = inject(FilemanagerFacade);

  isOpen = false;
  isLoading = false;
  isSaving = false;
  isCropMode = false;
  error: string | null = null;

  rotation = 0;
  brightness = 100;
  contrast = 100;
  saturate = 100;
  grayscale = 0;
  sepia = 0;

  outputFormat: OutputFormat = 'original';
  quality = 92;
  saveAsEnabled = false;
  saveAsFileName = '';
  compareMode = false;
  comparePosition = 50;

  private document: DocumentModel | null = null;
  private sourceImage: HTMLImageElement | null = null;
  private originalImageUrl: string | null = null;
  private cropRect: CropRect | null = null;
  private isDrawingCrop = false;
  private cropStart: { x: number; y: number } | null = null;

  private history: EditorSnapshot[] = [];
  private historyIndex = -1;
  private pendingInitialRender = false;

  get canUndo(): boolean {
    return this.historyIndex > 0;
  }

  get canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  get showQualityControl(): boolean {
    if (this.outputFormat === 'jpeg' || this.outputFormat === 'webp') {
      return true;
    }

    if (this.outputFormat !== 'original') {
      return false;
    }

    const mime = this.getOriginalMimeType();
    return mime === 'image/jpeg' || mime === 'image/webp';
  }

  ngAfterViewInit(): void {
    if (this.pendingInitialRender) {
      this.pendingInitialRender = false;
      this.renderPreviewWithRetry();
    }
  }

  async openDialog(document: DocumentModel): Promise<void> {
    this.resetEditorState();
    this.isOpen = true;
    this.isLoading = true;
    this.document = document;
    this.saveAsFileName = this.extractFileName(document);

    try {
      const response = await firstValueFrom(this.filemanagerFacade.getDocument(document));
      const blob = response instanceof Blob ? response : new Blob([response]);
      const imageUrl = URL.createObjectURL(blob);
      this.originalImageUrl = imageUrl;
      this.sourceImage = await this.loadImage(imageUrl);
      this.scheduleInitialRender();
      this.initializeHistory();
    } catch (error) {
      this.error = `Bild konnte nicht geladen werden: ${String(error)}`;
    } finally {
      this.isLoading = false;
    }
  }

  closeDialog(): void {
    this.isOpen = false;
    this.cleanupObjectUrl();
  }

  rotateLeft(): void {
    this.rotation = (this.rotation + 270) % 360;
    this.cropRect = null;
    this.pushHistory();
    this.renderPreview();
  }

  rotateRight(): void {
    this.rotation = (this.rotation + 90) % 360;
    this.cropRect = null;
    this.pushHistory();
    this.renderPreview();
  }

  undo(): void {
    if (!this.canUndo) {
      return;
    }

    this.historyIndex -= 1;
    this.restoreSnapshot(this.history[this.historyIndex]);
    this.renderPreview();
  }

  redo(): void {
    if (!this.canRedo) {
      return;
    }

    this.historyIndex += 1;
    this.restoreSnapshot(this.history[this.historyIndex]);
    this.renderPreview();
  }

  resetAdjustments(): void {
    this.rotation = 0;
    this.brightness = 100;
    this.contrast = 100;
    this.saturate = 100;
    this.grayscale = 0;
    this.sepia = 0;
    this.cropRect = null;
    this.isCropMode = false;
    this.pushHistory();
    this.renderPreview();
  }

  toggleCropMode(): void {
    this.isCropMode = !this.isCropMode;
    if (!this.isCropMode) {
      this.isDrawingCrop = false;
      this.cropStart = null;
    }
    this.renderPreview();
  }

  onFilterPreview(): void {
    this.renderPreview();
  }

  onFilterCommit(): void {
    this.pushHistory();
    this.renderPreview();
  }

  onCompareChange(): void {
    this.renderPreview();
  }

  onCanvasMouseDown(event: MouseEvent): void {
    if (!this.isCropMode) {
      return;
    }

    const point = this.toCanvasPoint(event);
    this.cropStart = point;
    this.cropRect = { x: point.x, y: point.y, width: 0, height: 0 };
    this.isDrawingCrop = true;
    this.renderPreview();
  }

  onCanvasMouseMove(event: MouseEvent): void {
    if (!this.isCropMode || !this.isDrawingCrop || !this.cropStart) {
      return;
    }

    const current = this.toCanvasPoint(event);
    this.cropRect = {
      x: Math.min(this.cropStart.x, current.x),
      y: Math.min(this.cropStart.y, current.y),
      width: Math.abs(current.x - this.cropStart.x),
      height: Math.abs(current.y - this.cropStart.y),
    };
    this.renderPreview();
  }

  onCanvasMouseUp(): void {
    if (!this.isCropMode) {
      return;
    }

    this.isDrawingCrop = false;
    this.cropStart = null;

    if (this.cropRect && (this.cropRect.width < 2 || this.cropRect.height < 2)) {
      this.cropRect = null;
    }

    this.pushHistory();
    this.renderPreview();
  }

  async save(): Promise<void> {
    if (!this.document || this.isSaving || !this.sourceImage) {
      return;
    }

    this.isSaving = true;
    this.error = null;

    try {
      const { targetDocument, mimeType } = this.resolveTargetDocumentAndMimeType();
      const currentSettings = this.getCurrentRenderSettings();
      const baseCanvas = this.renderToCanvas(this.sourceImage, currentSettings);
      const outputCanvas = this.applyCrop(baseCanvas, this.cropRect);
      const quality = this.showQualityControl ? this.quality / 100 : undefined;
      const blob = await this.canvasToBlob(outputCanvas, mimeType, quality);
      await firstValueFrom(this.filemanagerFacade.saveDocument(targetDocument, blob));
      this.filemanagerFacade.reloadCurrentLocation();
      this.closeDialog();
    } catch (error) {
      this.error = `Bild konnte nicht gespeichert werden: ${String(error)}`;
    } finally {
      this.isSaving = false;
    }
  }

  private resolveTargetDocumentAndMimeType(): { targetDocument: DocumentModel; mimeType: string } {
    if (!this.document || !this.document.bucket) {
      throw new Error('Ungültiges Dokument für Speichern');
    }

    const mimeType = this.resolveMimeType();

    if (!this.saveAsEnabled) {
      return {
        targetDocument: this.document,
        mimeType,
      };
    }

    const rawFileName = this.saveAsFileName.trim();
    if (!rawFileName) {
      throw new Error('Dateiname für "Speichern unter" fehlt');
    }

    const sanitizedFileName = rawFileName.replace(/^\/+/, '');
    const extension = this.getExtensionForMimeType(mimeType);
    const fileName = this.ensureFileExtension(sanitizedFileName, extension);

    const currentKey = this.document.key || this.document.path || '';
    const lastSlash = currentKey.lastIndexOf('/');
    const directory = lastSlash >= 0 ? currentKey.substring(0, lastSlash + 1) : '';
    const targetKey = `${directory}${fileName}`;

    return {
      targetDocument: {
        ...this.document,
        key: targetKey,
        path: targetKey,
        name: fileName,
      },
      mimeType,
    };
  }

  private resolveMimeType(): string {
    if (this.outputFormat === 'png') {
      return 'image/png';
    }
    if (this.outputFormat === 'jpeg') {
      return 'image/jpeg';
    }
    if (this.outputFormat === 'webp') {
      return 'image/webp';
    }

    return this.getOriginalMimeType();
  }

  private getOriginalMimeType(): string {
    if (this.document?.['content-type']?.startsWith('image/')) {
      return this.document['content-type'];
    }

    const key = this.document?.key || this.document?.path || '';
    const extension = key.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'webp':
        return 'image/webp';
      case 'gif':
        return 'image/gif';
      case 'bmp':
        return 'image/bmp';
      default:
        return 'image/png';
    }
  }

  private getExtensionForMimeType(mimeType: string): string {
    switch (mimeType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/webp':
        return 'webp';
      case 'image/gif':
        return 'gif';
      case 'image/bmp':
        return 'bmp';
      default:
        return 'png';
    }
  }

  private ensureFileExtension(fileName: string, extension: string): string {
    if (!extension) {
      return fileName;
    }

    if (fileName.toLowerCase().endsWith(`.${extension}`)) {
      return fileName;
    }

    return `${fileName}.${extension}`;
  }

  private renderPreview(): void {
    if (!this.canvasRef?.nativeElement || !this.sourceImage) {
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const currentSettings = this.getCurrentRenderSettings();
    const rendered = this.renderToCanvas(this.sourceImage, currentSettings);
    canvas.width = rendered.width;
    canvas.height = rendered.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.compareMode) {
      const original = this.renderToCanvas(this.sourceImage, this.getNeutralRenderSettings());
      ctx.drawImage(original, 0, 0);

      const splitX = Math.floor((canvas.width * this.comparePosition) / 100);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, canvas.height);
      ctx.clip();
      ctx.drawImage(rendered, 0, 0);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, canvas.height);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.drawImage(rendered, 0, 0);
    }

    if (this.isCropMode && this.cropRect && this.cropRect.width > 0 && this.cropRect.height > 0) {
      this.drawCropOverlay(ctx, canvas.width, canvas.height, this.cropRect);
    }
  }

  private getCurrentRenderSettings(): RenderSettings {
    return {
      rotation: this.rotation,
      brightness: this.brightness,
      contrast: this.contrast,
      saturate: this.saturate,
      grayscale: this.grayscale,
      sepia: this.sepia,
    };
  }

  private getNeutralRenderSettings(): RenderSettings {
    return {
      rotation: this.rotation,
      brightness: 100,
      contrast: 100,
      saturate: 100,
      grayscale: 0,
      sepia: 0,
    };
  }

  private renderToCanvas(image: HTMLImageElement, settings: RenderSettings): HTMLCanvasElement {
    const rotation = ((settings.rotation % 360) + 360) % 360;
    const rotateSwap = rotation === 90 || rotation === 270;
    const width = rotateSwap ? image.naturalHeight : image.naturalWidth;
    const height = rotateSwap ? image.naturalWidth : image.naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return canvas;
    }

    ctx.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturate}%) grayscale(${settings.grayscale}%) sepia(${settings.sepia}%)`;
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = 'none';

    return canvas;
  }

  private applyCrop(canvas: HTMLCanvasElement, rect: CropRect | null): HTMLCanvasElement {
    if (!rect || rect.width < 2 || rect.height < 2) {
      return canvas;
    }

    const sx = Math.max(0, Math.floor(rect.x));
    const sy = Math.max(0, Math.floor(rect.y));
    const sw = Math.min(canvas.width - sx, Math.floor(rect.width));
    const sh = Math.min(canvas.height - sy, Math.floor(rect.height));

    if (sw <= 0 || sh <= 0) {
      return canvas;
    }

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = sw;
    croppedCanvas.height = sh;
    const ctx = croppedCanvas.getContext('2d');
    if (!ctx) {
      return canvas;
    }
    ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    return croppedCanvas;
  }

  private drawCropOverlay(ctx: CanvasRenderingContext2D, width: number, height: number, rect: CropRect): void {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(0, 0, width, height);
    ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    ctx.restore();
  }

  private toCanvasPoint(event: MouseEvent): { x: number; y: number } {
    const canvas = this.canvasRef.nativeElement;
    const bounds = canvas.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * canvas.width;
    const y = ((event.clientY - bounds.top) / bounds.height) * canvas.height;
    return { x, y };
  }

  private async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Image load failed'));
      image.src = url;
    });
  }

  private async canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Blob conversion failed'));
            return;
          }
          resolve(blob);
        },
        mimeType,
        quality,
      );
    });
  }

  private extractFileName(document: DocumentModel): string {
    const key = document.key || document.path || document.name || 'edited-image';
    const lastSlash = key.lastIndexOf('/');
    return lastSlash >= 0 ? key.substring(lastSlash + 1) : key;
  }

  private createSnapshot(): EditorSnapshot {
    return {
      rotation: this.rotation,
      brightness: this.brightness,
      contrast: this.contrast,
      saturate: this.saturate,
      grayscale: this.grayscale,
      sepia: this.sepia,
      cropRect: this.cropRect
        ? {
            x: this.cropRect.x,
            y: this.cropRect.y,
            width: this.cropRect.width,
            height: this.cropRect.height,
          }
        : null,
    };
  }

  private restoreSnapshot(snapshot: EditorSnapshot): void {
    this.rotation = snapshot.rotation;
    this.brightness = snapshot.brightness;
    this.contrast = snapshot.contrast;
    this.saturate = snapshot.saturate;
    this.grayscale = snapshot.grayscale;
    this.sepia = snapshot.sepia;
    this.cropRect = snapshot.cropRect
      ? {
          x: snapshot.cropRect.x,
          y: snapshot.cropRect.y,
          width: snapshot.cropRect.width,
          height: snapshot.cropRect.height,
        }
      : null;
  }

  private isSameSnapshot(a: EditorSnapshot, b: EditorSnapshot): boolean {
    const cropA = a.cropRect;
    const cropB = b.cropRect;
    const cropEqual =
      (!cropA && !cropB) ||
      (!!cropA &&
        !!cropB &&
        cropA.x === cropB.x &&
        cropA.y === cropB.y &&
        cropA.width === cropB.width &&
        cropA.height === cropB.height);

    return (
      a.rotation === b.rotation &&
      a.brightness === b.brightness &&
      a.contrast === b.contrast &&
      a.saturate === b.saturate &&
      a.grayscale === b.grayscale &&
      a.sepia === b.sepia &&
      cropEqual
    );
  }

  private initializeHistory(): void {
    const snapshot = this.createSnapshot();
    this.history = [snapshot];
    this.historyIndex = 0;
  }

  private pushHistory(): void {
    if (this.historyIndex < 0) {
      this.initializeHistory();
      return;
    }

    const current = this.createSnapshot();
    const active = this.history[this.historyIndex];

    if (this.isSameSnapshot(current, active)) {
      return;
    }

    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push(current);

    if (this.history.length > 50) {
      this.history.shift();
    }

    this.historyIndex = this.history.length - 1;
  }

  private resetEditorState(): void {
    this.error = null;
    this.rotation = 0;
    this.brightness = 100;
    this.contrast = 100;
    this.saturate = 100;
    this.grayscale = 0;
    this.sepia = 0;
    this.outputFormat = 'original';
    this.quality = 92;
    this.saveAsEnabled = false;
    this.saveAsFileName = '';
    this.compareMode = false;
    this.comparePosition = 50;
    this.isCropMode = false;
    this.cropRect = null;
    this.isDrawingCrop = false;
    this.cropStart = null;
    this.sourceImage = null;
    this.history = [];
    this.historyIndex = -1;
    this.pendingInitialRender = false;
    this.cleanupObjectUrl();
  }

  private scheduleInitialRender(): void {
    if (!this.canvasRef?.nativeElement) {
      this.pendingInitialRender = true;
    }
    this.renderPreviewWithRetry();
  }

  private renderPreviewWithRetry(tries: number = 8): void {
    if (this.canvasRef?.nativeElement && this.sourceImage) {
      this.renderPreview();
      return;
    }

    if (tries <= 0) {
      return;
    }

    setTimeout(() => this.renderPreviewWithRetry(tries - 1), 16);
  }

  private cleanupObjectUrl(): void {
    if (!this.originalImageUrl) {
      return;
    }
    URL.revokeObjectURL(this.originalImageUrl);
    this.originalImageUrl = null;
  }
}

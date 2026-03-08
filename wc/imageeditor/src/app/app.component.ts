import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

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

export interface ImageEditorSaveEventDetail {
  blob: Blob;
  fileName: string;
  mimeType: string;
  saveAs: boolean;
}

@Component({
  selector: 'ladon-image-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
})
export class ImageEditorComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input('image-src') imageSrc: string | null = null;
  @Input('file-name') fileName = 'edited-image';
  @Input('mime-type') mimeType = 'image/png';

  @Output('editor-close') editorClose = new EventEmitter<void>();
  @Output('editor-save') editorSave = new EventEmitter<ImageEditorSaveEventDetail>();

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

  private sourceImage: HTMLImageElement | null = null;
  private cropRect: CropRect | null = null;
  private isDrawingCrop = false;
  private cropStart: { x: number; y: number } | null = null;

  private history: EditorSnapshot[] = [];
  private historyIndex = -1;
  private pendingInitialRender = false;
  private loadVersion = 0;

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fileName'] && this.fileName && !this.saveAsEnabled) {
      this.saveAsFileName = this.fileName;
    }

    if (changes['imageSrc']) {
      const nextSrc = (this.imageSrc || '').trim();
      if (!nextSrc) {
        this.clearEditor();
        return;
      }
      void this.loadSource(nextSrc);
    }
  }

  ngOnDestroy(): void {
    this.loadVersion += 1;
  }

  close(): void {
    this.editorClose.emit();
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
    if (this.isSaving || !this.sourceImage) {
      return;
    }

    this.isSaving = true;
    this.error = null;

    try {
      const mimeType = this.resolveMimeType();
      const baseCanvas = this.renderToCanvas(this.sourceImage, this.getCurrentRenderSettings());
      const outputCanvas = this.applyCrop(baseCanvas, this.cropRect);
      const quality = this.showQualityControl ? this.quality / 100 : undefined;
      const blob = await this.canvasToBlob(outputCanvas, mimeType, quality);

      const rawFileName = (this.saveAsEnabled ? this.saveAsFileName : this.fileName).trim();
      if (!rawFileName) {
        throw new Error('Dateiname fehlt');
      }

      const extension = this.getExtensionForMimeType(mimeType);
      const targetFileName = this.ensureFileExtension(rawFileName.replace(/^\/+/, ''), extension);

      this.editorSave.emit({
        blob,
        fileName: targetFileName,
        mimeType,
        saveAs: this.saveAsEnabled,
      });
    } catch (error) {
      this.error = `Bild konnte nicht gespeichert werden: ${String(error)}`;
    } finally {
      this.isSaving = false;
    }
  }

  private async loadSource(src: string): Promise<void> {
    const version = ++this.loadVersion;
    this.prepareNewSource();
    this.isLoading = true;

    try {
      const image = await this.loadImage(src);
      if (version !== this.loadVersion) {
        return;
      }

      this.sourceImage = image;
      this.scheduleInitialRender();
      this.initializeHistory();
    } catch (error) {
      if (version !== this.loadVersion) {
        return;
      }
      this.error = `Bild konnte nicht geladen werden: ${String(error)}`;
    } finally {
      if (version === this.loadVersion) {
        this.isLoading = false;
      }
    }
  }

  private prepareNewSource(): void {
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
    this.saveAsFileName = this.fileName || 'edited-image';
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
  }

  private clearEditor(): void {
    this.loadVersion += 1;
    this.prepareNewSource();
    this.isLoading = false;

    if (this.canvasRef?.nativeElement) {
      const canvas = this.canvasRef.nativeElement;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
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
    if (this.mimeType?.startsWith('image/')) {
      return this.mimeType;
    }

    const extension = this.getFileExtension(this.fileName || this.imageSrc || '');

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

  private getFileExtension(name: string): string {
    const sanitized = name.split('?')[0].split('#')[0];
    const segments = sanitized.split('.');
    if (segments.length < 2) {
      return '';
    }
    return segments[segments.length - 1].toLowerCase();
  }

  private ensureFileExtension(fileName: string, extension: string): string {
    const ext = this.getFileExtension(fileName);
    if (ext === extension.toLowerCase()) {
      return fileName;
    }

    if (ext) {
      const withoutExt = fileName.substring(0, fileName.length - ext.length - 1);
      return `${withoutExt}.${extension}`;
    }

    return `${fileName}.${extension}`;
  }
}

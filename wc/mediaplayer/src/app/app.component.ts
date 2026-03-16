import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

type MediaInputType = 'auto' | 'image' | 'audio' | 'video';
type ResolvedMediaType = 'image' | 'audio' | 'video' | 'unknown';

interface VideoThumbnail {
  time: number;
  dataUrl: string;
}

interface TimelinePreview {
  time: number;
  imageUrl: string | null;
  positionPercent: number;
}

interface EditableMetadata {
  title: string;
  description: string;
  tags: string;
  cameraMake: string;
  cameraModel: string;
  capturedAt: string;
  latitude: string;
  longitude: string;
}

interface ExifMetadataExtract {
  cameraMake?: string;
  cameraModel?: string;
  capturedAt?: string;
  latitude?: number;
  longitude?: number;
}

interface GeoLocationLike {
  lat?: unknown;
  lng?: unknown;
  lon?: unknown;
  latitude?: unknown;
  longitude?: unknown;
}

export interface MediaMetadataSaveEventDetail {
  mediaType: ResolvedMediaType;
  src: string | null;
  fileName: string;
  metadata: {
    title: string | null;
    description: string | null;
    tags: string[];
    camera: {
      make: string | null;
      model: string | null;
    };
    capturedAt: string | null;
    geotag: {
      latitude: number | null;
      longitude: number | null;
    };
  };
}

@Component({
  selector: 'ladon-media-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaPlayerComponent implements OnChanges {
  @Input('media-src') mediaSrc: string | null = null;
  @Input('media-type') mediaType: MediaInputType = 'auto';
  @Input('file-name') fileName = '';
  @Input('metadata') metadata: string | null = null;

  @Output('metadata-save') metadataSave = new EventEmitter<MediaMetadataSaveEventDetail>();

  @ViewChild('videoEl') videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('audioEl') audioRef?: ElementRef<HTMLAudioElement>;

  readonly resolvedMediaType = signal<ResolvedMediaType>('unknown');
  readonly error = signal<string | null>(null);

  readonly videoDuration = signal(0);
  readonly videoCurrentTime = signal(0);
  readonly videoThumbnails = signal<VideoThumbnail[]>([]);
  readonly isGeneratingVideoThumbnails = signal(false);
  readonly timelinePreview = signal<TimelinePreview | null>(null);

  readonly audioDuration = signal(0);
  readonly audioCurrentTime = signal(0);
  readonly waveformPeaks = signal<number[]>([]);

  readonly metadataDraft = signal<EditableMetadata>(this.createEmptyMetadata());
  readonly waveformPlayedIndex = computed(() => {
    const peaks = this.waveformPeaks();
    if (peaks.length === 0) {
      return -1;
    }

    const duration = this.audioDuration();
    if (duration <= 0) {
      return -1;
    }

    const ratio = this.audioCurrentTime() / duration;
    const maxIndex = peaks.length - 1;
    return Math.max(0, Math.min(maxIndex, Math.floor(ratio * maxIndex)));
  });

  private waveformJobId = 0;
  private thumbnailJobId = 0;
  private exifJobId = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mediaSrc'] || changes['mediaType'] || changes['metadata'] || changes['fileName']) {
      void this.prepareMedia();
    }
  }

  onVideoMetadataLoaded(): void {
    const video = this.videoRef?.nativeElement;
    if (!video) {
      return;
    }

    this.videoDuration.set(Number.isFinite(video.duration) ? video.duration : 0);
    this.videoCurrentTime.set(video.currentTime || 0);

    const source = this.mediaSrc?.trim();
    if (source) {
      void this.generateVideoThumbnails(source, this.videoDuration());
    }
  }

  onVideoTimeUpdate(): void {
    const video = this.videoRef?.nativeElement;
    if (!video) {
      return;
    }

    this.videoCurrentTime.set(video.currentTime || 0);
  }

  onVideoSeekInput(event: Event): void {
    const video = this.videoRef?.nativeElement;
    if (!video) {
      return;
    }

    const value = Number((event.target as HTMLInputElement).value);
    if (!Number.isFinite(value)) {
      return;
    }

    video.currentTime = value;
    this.videoCurrentTime.set(value);
  }

  onVideoTimelineHover(event: MouseEvent): void {
    const duration = this.videoDuration();
    if (duration <= 0) {
      return;
    }

    const target = event.currentTarget as HTMLInputElement;
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }

    const ratio = this.clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const previewTime = ratio * duration;
    const thumbnail = this.findClosestThumbnail(previewTime);

    this.timelinePreview.set({
      time: previewTime,
      imageUrl: thumbnail?.dataUrl || null,
      positionPercent: ratio * 100,
    });
  }

  hideVideoTimelinePreview(): void {
    this.timelinePreview.set(null);
  }

  seekVideo(time: number): void {
    const video = this.videoRef?.nativeElement;
    if (!video || !Number.isFinite(time)) {
      return;
    }

    video.currentTime = this.clamp(time, 0, this.videoDuration());
    this.videoCurrentTime.set(video.currentTime);
  }

  isThumbnailActive(thumbnail: VideoThumbnail): boolean {
    return Math.abs(this.videoCurrentTime() - thumbnail.time) <= 0.5;
  }

  onAudioMetadataLoaded(): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio) {
      return;
    }

    this.audioDuration.set(Number.isFinite(audio.duration) ? audio.duration : 0);
  }

  onAudioTimeUpdate(): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio) {
      return;
    }

    this.audioCurrentTime.set(audio.currentTime || 0);
  }

  onAudioSeekInput(event: Event): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio) {
      return;
    }

    const value = Number((event.target as HTMLInputElement).value);
    if (!Number.isFinite(value)) {
      return;
    }

    audio.currentTime = value;
    this.audioCurrentTime.set(value);
  }

  updateMetadataField(field: keyof EditableMetadata, value: string): void {
    this.metadataDraft.update((current) => ({
      ...current,
      [field]: value,
    }));
  }

  useCurrentLocationAsGeoTag(): void {
    if (!('geolocation' in navigator)) {
      this.error.set('Geolocation ist in diesem Browser nicht verfügbar.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.metadataDraft.update((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
      },
      (geoError) => {
        this.error.set(`Geo-Tag konnte nicht ermittelt werden: ${geoError.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }

  clearGeoTags(): void {
    this.metadataDraft.update((current) => ({
      ...current,
      latitude: '',
      longitude: '',
    }));
  }

  saveMetadata(): void {
    const draft = this.metadataDraft();
    const payload: MediaMetadataSaveEventDetail = {
      mediaType: this.resolvedMediaType(),
      src: this.mediaSrc,
      fileName: this.fileName,
      metadata: {
        title: this.cleanString(draft.title),
        description: this.cleanString(draft.description),
        tags: draft.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
        camera: {
          make: this.cleanString(draft.cameraMake),
          model: this.cleanString(draft.cameraModel),
        },
        capturedAt: this.cleanString(draft.capturedAt),
        geotag: {
          latitude: this.parseOptionalNumber(draft.latitude),
          longitude: this.parseOptionalNumber(draft.longitude),
        },
      },
    };

    this.metadataSave.emit(payload);
  }

  formatDuration(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return '00:00';
    }

    const totalSeconds = Math.floor(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  private async prepareMedia(): Promise<void> {
    const source = this.mediaSrc?.trim() || null;
    this.error.set(null);

    this.videoCurrentTime.set(0);
    this.videoDuration.set(0);
    this.videoThumbnails.set([]);
    this.timelinePreview.set(null);

    this.audioCurrentTime.set(0);
    this.audioDuration.set(0);
    this.waveformPeaks.set([]);

    const resolvedType = this.resolveMediaType(source, this.mediaType);
    this.resolvedMediaType.set(resolvedType);

    const baseMetadata = this.buildBaseMetadata();
    this.metadataDraft.set(baseMetadata);

    if (!source || resolvedType === 'unknown') {
      return;
    }

    if (resolvedType === 'audio') {
      await this.generateWaveform(source);
      return;
    }

    if (resolvedType === 'image') {
      await this.extractExifIntoMetadata(source);
    }
  }

  private buildBaseMetadata(): EditableMetadata {
    const metadataFromInput = this.parseMetadataInput(this.metadata);

    return {
      ...this.createEmptyMetadata(),
      title: this.fileName || metadataFromInput.title || '',
      description: metadataFromInput.description || '',
      tags: metadataFromInput.tags || '',
      cameraMake: metadataFromInput.cameraMake || '',
      cameraModel: metadataFromInput.cameraModel || '',
      capturedAt: metadataFromInput.capturedAt || '',
      latitude: metadataFromInput.latitude || '',
      longitude: metadataFromInput.longitude || '',
    };
  }

  private parseMetadataInput(value: string | null): Partial<EditableMetadata> {
    if (!value) {
      return {};
    }

    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      const geo = this.extractGeoLocation(parsed['geotag']) || this.extractGeoLocation(parsed['geo']) || {};

      return {
        title: this.toOptionalString(parsed['title']) || '',
        description: this.toOptionalString(parsed['description']) || '',
        tags: this.toCsvTags(parsed['tags']),
        cameraMake:
          this.toOptionalString(parsed['cameraMake']) ||
          this.toOptionalString(parsed['make']) ||
          this.toOptionalString((parsed['camera'] as Record<string, unknown> | undefined)?.['make']) ||
          '',
        cameraModel:
          this.toOptionalString(parsed['cameraModel']) ||
          this.toOptionalString(parsed['model']) ||
          this.toOptionalString((parsed['camera'] as Record<string, unknown> | undefined)?.['model']) ||
          '',
        capturedAt:
          this.toOptionalString(parsed['capturedAt']) ||
          this.toOptionalString(parsed['dateTimeOriginal']) ||
          this.toOptionalString(parsed['dateTaken']) ||
          '',
        latitude: this.toOptionalString(parsed['latitude']) || this.toOptionalString(geo.lat) || '',
        longitude: this.toOptionalString(parsed['longitude']) || this.toOptionalString(geo.lng) || '',
      };
    } catch {
      this.error.set('Metadaten-JSON konnte nicht gelesen werden.');
      return {};
    }
  }

  private async generateWaveform(source: string): Promise<void> {
    const currentJob = ++this.waveformJobId;

    try {
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      if (currentJob !== this.waveformJobId) {
        return;
      }

      const audioContext = new AudioContext();
      try {
        const decoded = await audioContext.decodeAudioData(buffer.slice(0));
        if (currentJob !== this.waveformJobId) {
          return;
        }

        const channelData = decoded.getChannelData(0);
        const peaks = this.buildWaveformPeaks(channelData, 160);
        this.waveformPeaks.set(peaks);
      } finally {
        await audioContext.close();
      }
    } catch {
      if (currentJob === this.waveformJobId) {
        this.waveformPeaks.set([]);
      }
    }
  }

  private buildWaveformPeaks(channelData: Float32Array, peakCount: number): number[] {
    if (channelData.length === 0 || peakCount <= 0) {
      return [];
    }

    const blockSize = Math.max(1, Math.floor(channelData.length / peakCount));
    const peaks: number[] = [];

    for (let i = 0; i < peakCount; i++) {
      const start = i * blockSize;
      const end = Math.min(channelData.length, start + blockSize);
      let max = 0;

      for (let cursor = start; cursor < end; cursor++) {
        const value = Math.abs(channelData[cursor] || 0);
        if (value > max) {
          max = value;
        }
      }

      peaks.push(this.clamp(max, 0.03, 1));
    }

    return peaks;
  }

  private async generateVideoThumbnails(source: string, duration: number): Promise<void> {
    const currentJob = ++this.thumbnailJobId;
    this.isGeneratingVideoThumbnails.set(true);

    try {
      if (!Number.isFinite(duration) || duration <= 0) {
        this.videoThumbnails.set([]);
        return;
      }

      const probeVideo = document.createElement('video');
      probeVideo.preload = 'auto';
      probeVideo.muted = true;
      probeVideo.crossOrigin = 'anonymous';
      probeVideo.src = source;

      await this.waitForMediaEvent(probeVideo, 'loadedmetadata');
      if (currentJob !== this.thumbnailJobId) {
        return;
      }

      const thumbnailCount = Math.max(6, Math.min(14, Math.floor(duration)));
      const targetWidth = 160;
      const ratio = probeVideo.videoHeight > 0 ? probeVideo.videoWidth / probeVideo.videoHeight : 16 / 9;
      const targetHeight = Math.max(90, Math.round(targetWidth / ratio));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const context = canvas.getContext('2d');
      if (!context) {
        this.videoThumbnails.set([]);
        return;
      }

      const thumbnails: VideoThumbnail[] = [];

      for (let index = 0; index < thumbnailCount; index++) {
        if (currentJob !== this.thumbnailJobId) {
          return;
        }

        const sampleTime = (duration * index) / Math.max(thumbnailCount - 1, 1);
        await this.seekVideoElement(probeVideo, sampleTime);

        context.drawImage(probeVideo, 0, 0, targetWidth, targetHeight);
        thumbnails.push({
          time: sampleTime,
          dataUrl: canvas.toDataURL('image/jpeg', 0.72),
        });
      }

      if (currentJob === this.thumbnailJobId) {
        this.videoThumbnails.set(thumbnails);
      }
    } catch {
      if (currentJob === this.thumbnailJobId) {
        this.videoThumbnails.set([]);
      }
    } finally {
      if (currentJob === this.thumbnailJobId) {
        this.isGeneratingVideoThumbnails.set(false);
      }
    }
  }

  private waitForMediaEvent(media: HTMLMediaElement, eventName: keyof HTMLMediaElementEventMap): Promise<void> {
    return new Promise((resolve, reject) => {
      const onResolve = () => {
        cleanup();
        resolve();
      };

      const onReject = () => {
        cleanup();
        reject(new Error(`Media event ${String(eventName)} failed`));
      };

      const cleanup = () => {
        media.removeEventListener(eventName, onResolve);
        media.removeEventListener('error', onReject);
      };

      media.addEventListener(eventName, onResolve, { once: true });
      media.addEventListener('error', onReject, { once: true });
    });
  }

  private seekVideoElement(video: HTMLVideoElement, time: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const onSeeked = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error('Seek fehlgeschlagen'));
      };

      const cleanup = () => {
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
      };

      video.addEventListener('seeked', onSeeked, { once: true });
      video.addEventListener('error', onError, { once: true });
      video.currentTime = this.clamp(time, 0, Number.isFinite(video.duration) ? video.duration : time);
    });
  }

  private findClosestThumbnail(targetTime: number): VideoThumbnail | null {
    const thumbnails = this.videoThumbnails();
    if (thumbnails.length === 0) {
      return null;
    }

    return thumbnails.reduce((closest, current) =>
      Math.abs(current.time - targetTime) < Math.abs(closest.time - targetTime) ? current : closest,
    );
  }

  private async extractExifIntoMetadata(source: string): Promise<void> {
    const currentJob = ++this.exifJobId;

    try {
      const response = await fetch(source);
      if (!response.ok) {
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      if (currentJob !== this.exifJobId) {
        return;
      }

      const extracted = this.parseExifMetadata(arrayBuffer);
      if (!extracted) {
        return;
      }

      this.metadataDraft.update((current) => ({
        ...current,
        cameraMake: current.cameraMake || extracted.cameraMake || '',
        cameraModel: current.cameraModel || extracted.cameraModel || '',
        capturedAt: current.capturedAt || extracted.capturedAt || '',
        latitude:
          current.latitude || (typeof extracted.latitude === 'number' ? extracted.latitude.toFixed(6) : ''),
        longitude:
          current.longitude || (typeof extracted.longitude === 'number' ? extracted.longitude.toFixed(6) : ''),
      }));
    } catch {
      // EXIF is optional; keep silent to avoid noisy UX for non-image or cross-origin assets.
    }
  }

  private parseExifMetadata(arrayBuffer: ArrayBuffer): ExifMetadataExtract | null {
    const view = new DataView(arrayBuffer);

    if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) {
      return null;
    }

    let offset = 2;
    while (offset + 4 < view.byteLength) {
      if (view.getUint8(offset) !== 0xff) {
        break;
      }

      const marker = view.getUint8(offset + 1);
      const segmentSize = view.getUint16(offset + 2, false);
      if (segmentSize < 2) {
        break;
      }

      if (marker === 0xe1) {
        return this.parseExifSegment(view, offset + 4, segmentSize - 2);
      }

      offset += segmentSize + 2;
    }

    return null;
  }

  private parseExifSegment(view: DataView, segmentStart: number, segmentLength: number): ExifMetadataExtract | null {
    if (segmentStart + segmentLength > view.byteLength || segmentLength < 14) {
      return null;
    }

    const exifHeader = this.readAscii(view, segmentStart, 6);
    if (exifHeader !== 'Exif\u0000\u0000') {
      return null;
    }

    const tiffStart = segmentStart + 6;
    const endianMarker = view.getUint16(tiffStart, false);
    const littleEndian = endianMarker === 0x4949;
    if (!littleEndian && endianMarker !== 0x4d4d) {
      return null;
    }

    const ifdOffset = this.readUint32(view, tiffStart + 4, littleEndian) + tiffStart;
    const ifd0 = this.readIfdEntries(view, ifdOffset, tiffStart, littleEndian);

    const extract: ExifMetadataExtract = {
      cameraMake: this.toOptionalString(ifd0.get(0x010f)),
      cameraModel: this.toOptionalString(ifd0.get(0x0110)),
      capturedAt: this.toOptionalString(ifd0.get(0x0132)),
    };

    const exifPointer = this.toOptionalNumber(ifd0.get(0x8769));
    if (typeof exifPointer === 'number') {
      const exifIfd = this.readIfdEntries(view, tiffStart + exifPointer, tiffStart, littleEndian);
      extract.capturedAt = this.toOptionalString(exifIfd.get(0x9003)) || extract.capturedAt;
    }

    const gpsPointer = this.toOptionalNumber(ifd0.get(0x8825));
    if (typeof gpsPointer === 'number') {
      const gpsIfd = this.readIfdEntries(view, tiffStart + gpsPointer, tiffStart, littleEndian);
      const latitude = this.toGpsCoordinate(
        this.toNumberArray(gpsIfd.get(0x0002)),
        this.toOptionalString(gpsIfd.get(0x0001)),
      );
      const longitude = this.toGpsCoordinate(
        this.toNumberArray(gpsIfd.get(0x0004)),
        this.toOptionalString(gpsIfd.get(0x0003)),
      );

      if (typeof latitude === 'number') {
        extract.latitude = latitude;
      }
      if (typeof longitude === 'number') {
        extract.longitude = longitude;
      }
    }

    return extract;
  }

  private readIfdEntries(
    view: DataView,
    ifdOffset: number,
    tiffStart: number,
    littleEndian: boolean,
  ): Map<number, string | number | number[]> {
    const map = new Map<number, string | number | number[]>();
    if (ifdOffset <= 0 || ifdOffset + 2 > view.byteLength) {
      return map;
    }

    const entryCount = this.readUint16(view, ifdOffset, littleEndian);

    for (let index = 0; index < entryCount; index++) {
      const entryOffset = ifdOffset + 2 + index * 12;
      if (entryOffset + 12 > view.byteLength) {
        break;
      }

      const tag = this.readUint16(view, entryOffset, littleEndian);
      const type = this.readUint16(view, entryOffset + 2, littleEndian);
      const valueCount = this.readUint32(view, entryOffset + 4, littleEndian);
      const valueOffsetField = entryOffset + 8;
      const value = this.readExifValue(view, type, valueCount, valueOffsetField, tiffStart, littleEndian);
      if (value !== null) {
        map.set(tag, value);
      }
    }

    return map;
  }

  private readExifValue(
    view: DataView,
    type: number,
    valueCount: number,
    valueOffsetField: number,
    tiffStart: number,
    littleEndian: boolean,
  ): string | number | number[] | null {
    const typeSizeMap: Record<number, number> = {
      1: 1,
      2: 1,
      3: 2,
      4: 4,
      5: 8,
    };

    const typeSize = typeSizeMap[type];
    if (!typeSize || valueCount <= 0) {
      return null;
    }

    const totalBytes = typeSize * valueCount;
    const valueOffset =
      totalBytes <= 4 ? valueOffsetField : tiffStart + this.readUint32(view, valueOffsetField, littleEndian);

    if (valueOffset < 0 || valueOffset + totalBytes > view.byteLength) {
      return null;
    }

    if (type === 2) {
      const ascii = this.readAscii(view, valueOffset, valueCount);
      return ascii.replace(/\u0000+$/, '').trim();
    }

    if (type === 5) {
      const values: number[] = [];
      for (let i = 0; i < valueCount; i++) {
        const rationalOffset = valueOffset + i * 8;
        const numerator = this.readUint32(view, rationalOffset, littleEndian);
        const denominator = this.readUint32(view, rationalOffset + 4, littleEndian);
        values.push(denominator === 0 ? 0 : numerator / denominator);
      }

      return valueCount === 1 ? values[0] : values;
    }

    const values: number[] = [];
    for (let i = 0; i < valueCount; i++) {
      const offset = valueOffset + i * typeSize;
      if (type === 1) {
        values.push(view.getUint8(offset));
      } else if (type === 3) {
        values.push(this.readUint16(view, offset, littleEndian));
      } else if (type === 4) {
        values.push(this.readUint32(view, offset, littleEndian));
      }
    }

    if (values.length === 0) {
      return null;
    }

    return values.length === 1 ? values[0] : values;
  }

  private toGpsCoordinate(values: number[] | undefined, ref: string | undefined): number | undefined {
    if (!values || values.length < 3) {
      return undefined;
    }

    const decimal = values[0] + values[1] / 60 + values[2] / 3600;
    if (!Number.isFinite(decimal)) {
      return undefined;
    }

    if (ref === 'S' || ref === 'W') {
      return -decimal;
    }

    return decimal;
  }

  private createEmptyMetadata(): EditableMetadata {
    return {
      title: '',
      description: '',
      tags: '',
      cameraMake: '',
      cameraModel: '',
      capturedAt: '',
      latitude: '',
      longitude: '',
    };
  }

  private resolveMediaType(source: string | null, declaredType: MediaInputType): ResolvedMediaType {
    if (declaredType !== 'auto') {
      return declaredType;
    }

    if (!source) {
      return 'unknown';
    }

    const normalized = source.toLowerCase();

    const mimeMatch = normalized.match(/^data:([^;,]+)[;,]/);
    if (mimeMatch && mimeMatch[1]) {
      const mimeType = mimeMatch[1];
      if (mimeType.startsWith('image/')) {
        return 'image';
      }
      if (mimeType.startsWith('audio/')) {
        return 'audio';
      }
      if (mimeType.startsWith('video/')) {
        return 'video';
      }
    }

    const sanitized = normalized.split('?')[0].split('#')[0];

    if (/\.(png|jpe?g|gif|webp|bmp|avif|heic|heif)$/i.test(sanitized)) {
      return 'image';
    }

    if (/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(sanitized)) {
      return 'audio';
    }

    if (/\.(mp4|webm|mov|m4v|ogv)$/i.test(sanitized)) {
      return 'video';
    }

    return 'unknown';
  }

  private extractGeoLocation(value: unknown): GeoLocationLike | undefined {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    return value as GeoLocationLike;
  }

  private toCsvTags(value: unknown): string {
    if (Array.isArray(value)) {
      return value
        .map((tag) => this.toOptionalString(tag))
        .filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
        .join(', ');
    }

    return this.toOptionalString(value) || '';
  }

  private toOptionalString(value: unknown): string | undefined {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }

    return undefined;
  }

  private toOptionalNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
  }

  private toNumberArray(value: unknown): number[] | undefined {
    if (Array.isArray(value)) {
      const numbers = value.filter((entry): entry is number => typeof entry === 'number' && Number.isFinite(entry));
      return numbers.length > 0 ? numbers : undefined;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return [value];
    }

    return undefined;
  }

  private cleanString(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private parseOptionalNumber(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private readUint16(view: DataView, offset: number, littleEndian: boolean): number {
    return view.getUint16(offset, littleEndian);
  }

  private readUint32(view: DataView, offset: number, littleEndian: boolean): number {
    return view.getUint32(offset, littleEndian);
  }

  private readAscii(view: DataView, offset: number, length: number): string {
    let output = '';
    const max = Math.min(view.byteLength, offset + length);

    for (let cursor = offset; cursor < max; cursor++) {
      output += String.fromCharCode(view.getUint8(cursor));
    }

    return output;
  }
}

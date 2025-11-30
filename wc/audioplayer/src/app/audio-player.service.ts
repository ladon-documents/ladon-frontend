import {Injectable, inject} from '@angular/core';
import {AudioPlayerStore, DocumentModel} from "./store/audio-player.store";

@Injectable({
  providedIn: 'root'
})
export class AudioPlayerService {
  private readonly store = inject(AudioPlayerStore);
  private audioElement: HTMLAudioElement | null = null;
  private readonly supportedFormats = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];

  constructor() {
    this.initializeAudioElement();
  }

  private initializeAudioElement(): void {
    this.audioElement = new Audio();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.audioElement) return;

    this.audioElement.addEventListener('loadstart', () => {
      this.store.setLoading(true);
    });

    this.audioElement.addEventListener('loadedmetadata', () => {
      this.store.setDuration(this.audioElement?.duration || 0);
      this.store.setLoading(false);
    });

    this.audioElement.addEventListener('timeupdate', () => {
      this.store.setCurrentTime(this.audioElement?.currentTime || 0);
    });

    this.audioElement.addEventListener('play', () => {
      this.store.setPlaying(true);
    });

    this.audioElement.addEventListener('pause', () => {
      this.store.setPaused(true);
    });

    this.audioElement.addEventListener('ended', () => {
      this.store.setPlaying(false);
      this.store.setCurrentTime(0);
    });

    this.audioElement.addEventListener('error', (event) => {
      const error = this.audioElement?.error;
      let errorMessage = 'Unbekannter Audio-Fehler';

      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Wiedergabe abgebrochen';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Netzwerkfehler beim Laden der Audio-Datei';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Audio-Datei kann nicht dekodiert werden';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio-Format wird nicht unterstützt';
            break;
        }
      }

      this.store.setError(errorMessage);
    });

    this.audioElement.addEventListener('volumechange', () => {
      if (this.audioElement) {
        this.store.setVolume(this.audioElement.volume);
      }
    });
  }

  loadTrack(document: DocumentModel): void {
    if (!this.isAudioFile(document)) {
      this.store.setError('Datei ist keine unterstützte Audio-Datei');
      return;
    }

    if (!this.audioElement) {
      this.initializeAudioElement();
    }

    this.store.setTrack(document);
    this.store.setError(null);

    if (this.audioElement && document.path) {
      const src = this.getDirectLink(document);
      if (src) {
        this.audioElement.src = src;
        this.audioElement.load();
      } else {
        this.store.setError('Datei konnte nicht bestimmt werden,  missing bucket or path');
      }
    }
  }

  play(): void {
    if (this.audioElement && this.store.canPlay()) {
      this.audioElement.play().catch(error => {
        this.store.setError('Wiedergabe konnte nicht gestartet werden');
        console.error('Audio play error:', error);
      });
    }
  }

  pause(): void {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }

  seekTo(seconds: number): void {
    if (this.audioElement && this.store.duration() > 0) {
      this.audioElement.currentTime = Math.max(0, Math.min(seconds, this.store.duration()));
    }
  }

  seekToPercentage(percentage: number): void {
    const duration = this.store.duration();
    if (duration > 0) {
      const targetTime = (percentage / 100) * duration;
      this.seekTo(targetTime);
    }
  }

  setVolume(volume: number): void {
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume));
    }
  }

  toggleMute(): void {
    if (this.audioElement) {
      this.audioElement.muted = !this.audioElement.muted;
      this.store.toggleMute();
    }
  }

  setPlaybackRate(rate: number): void {
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
      this.store.setPlaybackRate(rate);
    }
  }

  private isAudioFile(document: DocumentModel): boolean {
    if (!document.key) return false;

    const extension = document.key.split('.').pop()?.toLowerCase();
    return extension ? this.supportedFormats.includes(extension) : false;
  }

  destroy(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }
    this.store.reset();
  }

  private getDirectLink(document: DocumentModel) {
    const baseUrl: string = "/admin/api/filemanager";
    const {bucket, path} = document;
    if (bucket && path) {
      return `${baseUrl}/${encodeURIComponent(bucket)}/direct?id=${encodeURIComponent(path)}${""}`
    }
    return null;

  }
}

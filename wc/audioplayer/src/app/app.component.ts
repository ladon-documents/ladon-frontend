import {
  Component,
  input,
  OnInit,
  OnDestroy,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AudioPlayerService } from './audio-player.service';
import {AudioPlayerStore, DocumentModel} from './store/audio-player.store';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroPlay,
  heroPause,
  heroStop,
  heroSpeakerWave,
  heroSpeakerXMark,
  heroBackward,
  heroForward
} from '@ng-icons/heroicons/outline';
import {formatFileSize} from "../../../../api/utility/filesize.pipe";

@Component({
  selector: 'ladon-audio-player',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  providers: [
    provideIcons({
      heroPlay,
      heroPause,
      heroStop,
      heroSpeakerWave,
      heroSpeakerXMark,
      heroBackward,
      heroForward
    })
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="audio-player bg-base-100 rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div class="mb-4" *ngIf="store.currentTrack()">
        <h3 class="text-lg font-semibold text-base-content truncate">
          {{ store.currentTrack()?.key || 'Unbekannter Titel' }}
        </h3>
        <p class="text-sm text-base-content opacity-70" *ngIf="store.currentTrack()?.size">
          {{ formatFileSize(store.currentTrack()?.size || 0) }}
        </p>
      </div>

      <div class="mb-4 text-center opacity-50" *ngIf="!store.currentTrack() && !store.error()">
        <p class="text-base-content">Keine Audio-Datei ausgewählt</p>
      </div>

      <div class="alert alert-error mb-4" *ngIf="store.error()">
        <span>{{ store.error() }}</span>
      </div>

      <div class="mb-4">
        <div class="flex justify-between text-xs text-base-content opacity-70 mb-1">
          <span>{{ store.formattedCurrentTime() }}</span>
          <span>{{ store.formattedDuration() }}</span>
        </div>
        <input
                                                                                            type="range"
                                                                                            min="0"
                                                                                            max="100"
                                                                                            [value]="store.progress()"
                                                                                            (input)="onSeek($event)"
                                                                                            class="range range-primary range-sm w-full"
                                                                                            [disabled]="!store.canPlay() || store.duration() === 0"
        />
      </div>

      <div class="flex items-center justify-center gap-4 mb-4">
        <button
                                                                                            class="btn btn-circle btn-outline btn-sm"
                                                                                            (click)="rewind()"
                                                                                            [disabled]="!store.canPlay()"
                                                                                            title="10 Sekunden zurück"
        >
          <ng-icon name="heroBackward" size="16"></ng-icon>
        </button>

        <button
                                                                                            class="btn btn-circle btn-primary btn-lg"
                                                                                            (click)="togglePlayPause()"
                                                                                            [disabled]="!store.canPlay()"
        >
          <span class="loading loading-spinner loading-sm" *ngIf="store.isLoading()"></span>
          <ng-icon
                                                                                              [name]="store.isPlaying() ? 'heroPause' : 'heroPlay'"
                                                                                              size="24"
                                                                                              *ngIf="!store.isLoading()"
          ></ng-icon>
        </button>

        <button
                                                                                            class="btn btn-circle btn-outline btn-sm"
                                                                                            (click)="stop()"
                                                                                            [disabled]="!store.canPlay()"
                                                                                            title="Stopp"
        >
          <ng-icon name="heroStop" size="16"></ng-icon>
        </button>

        <button
                                                                                            class="btn btn-circle btn-outline btn-sm"
                                                                                            (click)="forward()"
                                                                                            [disabled]="!store.canPlay()"
                                                                                            title="10 Sekunden vor"
        >
          <ng-icon name="heroForward" size="16"></ng-icon>
        </button>
      </div>

      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 flex-1">
          <button
                                                                                              class="btn btn-ghost btn-xs btn-primary"
                                                                                              (click)="toggleMute()"
                                                                                              title="Stummschalten"
          >
            <ng-icon
                                                                                                [name]="store.isMuted() ? 'heroSpeakerXMark' : 'heroSpeakerWave'"
                                                                                                size="16"
            ></ng-icon>
          </button>
          <input
                                                                                              type="range"
                                                                                              min="0"
                                                                                              max="100"
                                                                                              [value]="store.displayVolume()"
                                                                                              (input)="onVolumeChange($event)"
                                                                                              class="range range-xs flex-1 text-primary"
          />
          <span class="text-xs text-base-content opacity-70 min-w-[3ch]">
            {{ store.displayVolume() }}%
          </span>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-base-content opacity-70">Speed:</span>
          <select
                                                                                              class="select select-xs w-20"
                                                                                              [value]="store.playbackRate()"
                                                                                              (change)="onSpeedChange($event)"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .audio-player {
      min-width: 320px;
    }

    .range:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn:disabled {
      opacity: 0.5;
    }

    .audio-player:has(.alert-error) {
      border: 1px solid hsl(var(--er));
    }
  `]
})
export class AudioPlayerComponent implements OnInit, OnDestroy {
  document = input<DocumentModel | null>(null);

  private readonly audioService = inject(AudioPlayerService);
  readonly store = inject(AudioPlayerStore);

  private documentEffect = effect(() => {
    const currentDocument = this.document();
    if (currentDocument) {
      console.log('Loading new track:', currentDocument.key);
      this.audioService.loadTrack(currentDocument);
    } else {
      console.log('No document provided, clearing track');
      this.store.setTrack(null);
    }
  });

  ngOnInit(): void {
    // Initial load falls document beim Start bereits gesetzt ist
    const initialDocument = this.document();
    if (initialDocument) {
      this.audioService.loadTrack(initialDocument);
    }
  }

  ngOnDestroy(): void {
    this.audioService.destroy();
  }

  togglePlayPause(): void {
    if (this.store.isPlaying()) {
      this.audioService.pause();
    } else {
      this.audioService.play();
    }
  }

  stop(): void {
    this.audioService.stop();
  }

  rewind(): void {
    const newTime = Math.max(0, this.store.currentTime() - 10);
    this.audioService.seekTo(newTime);
  }

  forward(): void {
    const newTime = Math.min(this.store.duration(), this.store.currentTime() + 10);
    this.audioService.seekTo(newTime);
  }

  onSeek(event: Event): void {
    const input = event.target as HTMLInputElement;
    const percentage = parseFloat(input.value);
    this.audioService.seekToPercentage(percentage);
  }

  onVolumeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const volume = parseFloat(input.value) / 100;
    this.audioService.setVolume(volume);
  }

  toggleMute(): void {
    this.audioService.toggleMute();
  }

  onSpeedChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const rate = parseFloat(select.value);
    this.audioService.setPlaybackRate(rate);
  }

  /*
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

   */
  protected readonly formatFileSize = formatFileSize;
}

import {signalStore, withState, withMethods, patchState, withComputed} from '@ngrx/signals';
import {computed, inject} from '@angular/core';


export interface DocumentMetadataModel {
  [key: string]: string | any;

  empty?: boolean;
}


export interface DocumentModel {
  'content-type'?: string;
  created?: string;
  'last-modified'?: string;
  bucket?: string;
  key?: string;
  path?: string;
  etag?: string;
  metadata?: DocumentMetadataModel;
  owner?: string;
  size?: number;
  version?: string;
  isFolder?: boolean;
}

export interface AudioPlayerState {
  currentTrack: DocumentModel | null;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  error: string | null;
}

const initialState: AudioPlayerState = {
  currentTrack: null,
  isPlaying: false,
  isPaused: false,
  isLoading: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  playbackRate: 1.0,
  error: null,
};

export const AudioPlayerStore = signalStore(
    {providedIn: 'root'},
    withState(initialState),
    withComputed((state) => ({
          progress: computed(() =>
              state.duration() > 0 ? (state.currentTime() / state.duration()) * 100 : 0
          ),
          formattedCurrentTime: computed(() => formatTime(state.currentTime())),
          formattedDuration: computed(() => formatTime(state.duration())),
          canPlay: computed(() => state.currentTrack() !== null && !state.isLoading()),
          displayVolume: computed(() => Math.round(state.volume() * 100)),
        }
    )),
    withMethods((store) => ({
      setTrack: (track: DocumentModel | null) => {
        patchState(store, {
          currentTrack: track,
          isPlaying: false,
          isPaused: false,
          currentTime: 0,
          duration: 0,
          error: null,
        });
      },

      setPlaying: (isPlaying: boolean) => {
        patchState(store, {isPlaying, isPaused: !isPlaying});
      },

      setPaused: (isPaused: boolean) => {
        patchState(store, {isPaused, isPlaying: !isPaused});
      },

      setLoading: (isLoading: boolean) => {
        patchState(store, {isLoading});
      },

      setCurrentTime: (currentTime: number) => {
        patchState(store, {currentTime});
      },

      setDuration: (duration: number) => {
        patchState(store, {duration});
      },

      setVolume: (volume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        patchState(store, {volume: clampedVolume, isMuted: clampedVolume === 0});
      },

      toggleMute: () => {
        const currentMuted = store.isMuted();
        patchState(store, {isMuted: !currentMuted});
      },

      setPlaybackRate: (rate: number) => {
        patchState(store, {playbackRate: Math.max(0.25, Math.min(2.0, rate))});
      },

      setError: (error: string | null) => {
        patchState(store, {error, isLoading: false, isPlaying: false});
      },

      reset: () => {
        patchState(store, initialState);
      },
    }))
);

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

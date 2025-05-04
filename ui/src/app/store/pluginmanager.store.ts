interface TransferState {
  activeTransfers: Array<{
    id: string;
    filename: string;
    progress: number;
    speed: number;
    type: 'download' | 'upload';
    status: 'pending' | 'active' | 'paused' | 'completed' | 'error';
    error?: string;
  }>;
  totalProgress: number;
  isPaused: boolean;
  queuedFiles: string[];
}

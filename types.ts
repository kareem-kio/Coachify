
export interface Transcription {
  role: 'user' | 'coach';
  text: string;
  timestamp: number;
}

export interface SessionState {
  isConnected: boolean;
  isSharing: boolean;
  isMuted: boolean;
  goal: string;
  milestone: string;
}

export interface DeviceStream {
  stream: MediaStream | null;
  error: string | null;
}

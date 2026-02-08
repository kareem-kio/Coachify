
export enum SessionState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR',
}

export type ChatMessage = {
  sender: 'user' | 'coach';
  text: string;
  timestamp: Date;
};

export type CodeSnippet = {
  userPrompt: string;
  code: string;
  timestamp: Date;
};

export type KeystrokePayload = {
  key: string;
  timestamp: number;
  expectedChar: string;
  isMatch: boolean;
  interKeyDelayMs?: number;
  holdDurationMs?: number;
  usedCorrection?: boolean;
  wordIndex: number;
  charIndex: number;
};

export type SessionSummary = {
  wpm: number;
  accuracy: number;
  durationMs: number;
};

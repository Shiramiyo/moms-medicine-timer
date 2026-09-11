export type MedicationCategory = 'pill' | 'drops' | 'capsule' | 'injection' | 'general';

export interface CountdownTimer {
  id: string;
  name: string;
  note?: string;
  category: MedicationCategory;
  durationSeconds: number;
  status: 'running' | 'paused' | 'completed';
  targetTimestamp: number | null; // Unix timestamp ms when timer reaches 0
  pausedRemainingSeconds: number; // Remaining seconds when paused
  color: string;
  repeatEveryHours?: number | null; // e.g. 4, 8, 12 hours
  notificationId?: string | null;
  createdAt: number;
  completedAt?: number;
}

export interface MedicationLogEntry {
  id: string;
  timerId: string;
  name: string;
  note?: string;
  category: MedicationCategory;
  takenAt: number; // Unix timestamp ms
}

export interface TimerPreset {
  id: string;
  name: string;
  note?: string;
  category: MedicationCategory;
  durationMinutes: number;
  color: string;
}

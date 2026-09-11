import AsyncStorage from '@react-native-async-storage/async-storage';
import { CountdownTimer, MedicationLogEntry, TimerPreset } from '../types/timer';

const TIMERS_STORAGE_KEY = '@dose_timer_active_timers';
const HISTORY_STORAGE_KEY = '@dose_timer_history_log';
const PRESETS_STORAGE_KEY = '@dose_timer_custom_presets';

export const DEFAULT_PRESETS: TimerPreset[] = [
  {
    id: 'preset-bp',
    name: 'Blood Pressure Pill',
    note: '1 tablet with full glass of water',
    category: 'pill',
    durationMinutes: 240, // 4 hours
    color: '#6366F1',
  },
  {
    id: 'preset-drops',
    name: 'Eye Drops',
    note: '2 drops in right eye',
    category: 'drops',
    durationMinutes: 120, // 2 hours
    color: '#0EA5E9',
  },
  {
    id: 'preset-lunch',
    name: 'After Lunch Vitamin D',
    note: 'Take right after meal',
    category: 'capsule',
    durationMinutes: 30, // 30 mins
    color: '#EC4899',
  },
  {
    id: 'preset-night',
    name: 'Night Heart Medication',
    note: 'Take before bedtime',
    category: 'pill',
    durationMinutes: 480, // 8 hours
    color: '#8B5CF6',
  },
];

export async function loadSavedTimers(): Promise<CountdownTimer[]> {
  try {
    const raw = await AsyncStorage.getItem(TIMERS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to load saved timers:', error);
    return [];
  }
}

export async function saveTimers(timers: CountdownTimer[]): Promise<void> {
  try {
    await AsyncStorage.setItem(TIMERS_STORAGE_KEY, JSON.stringify(timers));
  } catch (error) {
    console.warn('Failed to save timers:', error);
  }
}

export async function loadMedicationLog(): Promise<MedicationLogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to load medication history:', error);
    return [];
  }
}

export async function saveMedicationLog(log: MedicationLogEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(log));
  } catch (error) {
    console.warn('Failed to save medication history:', error);
  }
}

export async function clearMedicationLog(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear medication history:', error);
  }
}

export async function loadPresets(): Promise<TimerPreset[]> {
  try {
    const raw = await AsyncStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return DEFAULT_PRESETS;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to load presets:', error);
    return DEFAULT_PRESETS;
  }
}

export async function savePresets(presets: TimerPreset[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch (error) {
    console.warn('Failed to save presets:', error);
  }
}

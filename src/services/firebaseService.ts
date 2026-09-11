import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  set,
  Database,
  Unsubscribe,
} from 'firebase/database';
import { CountdownTimer, MedicationLogEntry } from '../types/timer';

export const firebaseConfig = {
  apiKey: "AIzaSyDeNmGmts1-IsUrILAO1ivMcgZoqEqvLDQ",
  authDomain: "mom-medicine-timer-768c6.firebaseapp.com",
  databaseURL: "https://mom-medicine-timer-768c6-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mom-medicine-timer-768c6",
  storageBucket: "mom-medicine-timer-768c6.firebasestorage.app",
  messagingSenderId: "1062917346961",
  appId: "1:1062917346961:web:db5f77697722b6035cd130",
  measurementId: "G-K6X529BMK6"
};

let db: Database | null = null;

try {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getDatabase(app);
} catch (error) {
  console.warn('Firebase initialization error:', error);
}

export function isCloudAvailable(): boolean {
  return db !== null;
}

// Real-time listener for multi-phone shared timers
export function listenToCloudTimers(
  onUpdate: (timers: CountdownTimer[]) => void
): Unsubscribe | null {
  if (!db) return null;
  const timersRef = ref(db, 'family_timers');

  return onValue(
    timersRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (Array.isArray(val)) {
          onUpdate(val);
        } else if (typeof val === 'object' && val !== null) {
          onUpdate(Object.values(val));
        } else {
          onUpdate([]);
        }
      } else {
        onUpdate([]);
      }
    },
    (error) => {
      console.warn('Firebase timers subscription error:', error);
    }
  );
}

// Push local changes to cloud so all other phones get updated immediately
export async function saveCloudTimers(timers: CountdownTimer[]): Promise<void> {
  if (!db) return;
  try {
    const timersRef = ref(db, 'family_timers');
    await set(timersRef, timers);
  } catch (error) {
    console.warn('Failed to save timers to cloud:', error);
  }
}

// Real-time listener for shared medication history log
export function listenToCloudHistory(
  onUpdate: (history: MedicationLogEntry[]) => void
): Unsubscribe | null {
  if (!db) return null;
  const historyRef = ref(db, 'family_history');

  return onValue(
    historyRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (Array.isArray(val)) {
          onUpdate(val);
        } else if (typeof val === 'object' && val !== null) {
          onUpdate(Object.values(val));
        } else {
          onUpdate([]);
        }
      } else {
        onUpdate([]);
      }
    },
    (error) => {
      console.warn('Firebase history subscription error:', error);
    }
  );
}

// Push medication taken log to cloud so all family members see it instantly
export async function saveCloudHistory(history: MedicationLogEntry[]): Promise<void> {
  if (!db) return;
  try {
    const historyRef = ref(db, 'family_history');
    await set(historyRef, history);
  } catch (error) {
    console.warn('Failed to save history to cloud:', error);
  }
}

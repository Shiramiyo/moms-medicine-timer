import { useState, useEffect, useCallback, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { CountdownTimer, MedicationLogEntry, MedicationCategory } from '../types/timer';
import {
  loadSavedTimers,
  saveTimers,
  loadMedicationLog,
  saveMedicationLog,
} from '../services/storageService';
import {
  scheduleMedicationNotification,
  cancelMedicationNotification,
  requestNotificationPermissions,
} from '../services/notificationService';
import { playAlarmSound } from '../services/soundService';
import {
  listenToCloudTimers,
  saveCloudTimers,
  listenToCloudHistory,
  saveCloudHistory,
  isCloudAvailable,
} from '../services/firebaseService';

export function useTimers() {
  const [timers, setTimers] = useState<CountdownTimer[]>([]);
  const [history, setHistory] = useState<MedicationLogEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const timersRef = useRef<CountdownTimer[]>([]);

  timersRef.current = timers;

  // Initialize and load saved timers & history
  useEffect(() => {
    async function init() {
      await requestNotificationPermissions();
      const savedTimers = await loadSavedTimers();
      const savedHistory = await loadMedicationLog();

      if (savedTimers.length > 0) {
        setTimers(savedTimers);
      } else {
        // Initial sample timers for quick start
        const initialTimers: CountdownTimer[] = [
          {
            id: 'sample-bp-1',
            name: "Mom: Blood Pressure Pill",
            note: '1 tablet with water after breakfast',
            category: 'pill',
            durationSeconds: 4 * 3600, // 4 hours
            status: 'running',
            targetTimestamp: Date.now() + 4 * 3600 * 1000,
            pausedRemainingSeconds: 4 * 3600,
            color: '#6366F1',
            repeatEveryHours: 8,
            createdAt: Date.now(),
          },
          {
            id: 'sample-drops-2',
            name: "Mom: Eye Drops",
            note: '2 drops in right eye',
            category: 'drops',
            durationSeconds: 2 * 3600, // 2 hours
            status: 'running',
            targetTimestamp: Date.now() + 2 * 3600 * 1000,
            pausedRemainingSeconds: 2 * 3600,
            color: '#0EA5E9',
            repeatEveryHours: 4,
            createdAt: Date.now(),
          },
        ];
        setTimers(initialTimers);
        await saveTimers(initialTimers);
      }

      setHistory(savedHistory);
      setIsLoaded(true);

      // Subscribe to real-time cloud updates across all family phones
      if (isCloudAvailable()) {
        const unsubTimers = listenToCloudTimers((cloudTimers) => {
          setIsCloudSynced(true);
          if (cloudTimers && cloudTimers.length > 0) {
            setTimers(cloudTimers);
            saveTimers(cloudTimers);
          }
        });

        const unsubHistory = listenToCloudHistory((cloudHistory) => {
          if (cloudHistory && cloudHistory.length > 0) {
            setHistory(cloudHistory);
            saveMedicationLog(cloudHistory);
          }
        });

        return () => {
          if (unsubTimers) unsubTimers();
          if (unsubHistory) unsubHistory();
        };
      }
    }

    const unsubPromise = init();
    return () => {
      unsubPromise.then((unsub) => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, []);

  // Save whenever timers change (after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveTimers(timers);
    }
  }, [timers, isLoaded]);

  // Save history whenever it changes
  useEffect(() => {
    if (isLoaded) {
      saveMedicationLog(history);
    }
  }, [history, isLoaded]);

  // 1-second interval ticker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);

      // Check if any timer has completed
      let hasUpdates = false;
      const currentTimers = timersRef.current;

      const updated = currentTimers.map((timer) => {
        if (timer.status === 'running' && timer.targetTimestamp && now >= timer.targetTimestamp) {
          hasUpdates = true;
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          playAlarmSound();
          return {
            ...timer,
            status: 'completed' as const,
            completedAt: now,
          };
        }
        return timer;
      });

      if (hasUpdates) {
        setTimers(updated);
        saveCloudTimers(updated);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Add new timer
  const addTimer = useCallback(
    async (
      name: string,
      durationMinutes: number,
      note?: string,
      category: MedicationCategory = 'pill',
      color: string = '#6366F1',
      repeatEveryHours?: number | null
    ) => {
      const durationSeconds = Math.max(durationMinutes * 60, 10);
      const targetTimestamp = Date.now() + durationSeconds * 1000;
      const timerId = `timer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const notificationId = await scheduleMedicationNotification(
        timerId,
        name,
        note,
        durationSeconds
      );

      const newTimer: CountdownTimer = {
        id: timerId,
        name,
        note,
        category,
        durationSeconds,
        status: 'running',
        targetTimestamp,
        pausedRemainingSeconds: durationSeconds,
        color,
        repeatEveryHours: repeatEveryHours || null,
        notificationId,
        createdAt: Date.now(),
      };

      const updated = [newTimer, ...timersRef.current];
      setTimers(updated);
      saveCloudTimers(updated);
    },
    []
  );

  // Pause timer
  const pauseTimer = useCallback(async (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const updated = timersRef.current.map((timer) => {
      if (timer.id !== id || timer.status !== 'running') return timer;

      cancelMedicationNotification(timer.notificationId);

      const remainingMs = timer.targetTimestamp ? timer.targetTimestamp - Date.now() : 0;
      const pausedSec = Math.max(0, Math.ceil(remainingMs / 1000));

      return {
        ...timer,
        status: 'paused' as const,
        targetTimestamp: null,
        pausedRemainingSeconds: pausedSec,
        notificationId: null,
      };
    });

    setTimers(updated);
    saveCloudTimers(updated);
  }, []);

  // Resume timer
  const resumeTimer = useCallback(async (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const timer = timersRef.current.find((t) => t.id === id);
    if (!timer) return;

    const remainingSec = timer.pausedRemainingSeconds > 0 ? timer.pausedRemainingSeconds : timer.durationSeconds;
    const targetTimestamp = Date.now() + remainingSec * 1000;

    const notificationId = await scheduleMedicationNotification(
      timer.id,
      timer.name,
      timer.note,
      remainingSec
    );

    const updated = timersRef.current.map((t) => {
      if (t.id !== id) return t;
      return {
        ...t,
        status: 'running' as const,
        targetTimestamp,
        notificationId,
      };
    });

    setTimers(updated);
    saveCloudTimers(updated);
  }, []);

  // Snooze timer (+5m, +15m, etc.)
  const snoozeTimer = useCallback(async (id: string, snoozeMinutes: number = 10) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const timer = timersRef.current.find((t) => t.id === id);
    if (!timer) return;

    await cancelMedicationNotification(timer.notificationId);

    const extraSeconds = snoozeMinutes * 60;
    const targetTimestamp = Date.now() + extraSeconds * 1000;

    const notificationId = await scheduleMedicationNotification(
      timer.id,
      timer.name,
      timer.note,
      extraSeconds
    );

    const updated = timersRef.current.map((t) => {
      if (t.id !== id) return t;
      return {
        ...t,
        status: 'running' as const,
        targetTimestamp,
        pausedRemainingSeconds: extraSeconds,
        notificationId,
        completedAt: undefined,
      };
    });

    setTimers(updated);
    saveCloudTimers(updated);
  }, []);

  // Reset timer
  const resetTimer = useCallback(async (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const timer = timersRef.current.find((t) => t.id === id);
    if (!timer) return;

    await cancelMedicationNotification(timer.notificationId);

    const updated = timersRef.current.map((t) => {
      if (t.id !== id) return t;
      return {
        ...t,
        status: 'paused' as const,
        targetTimestamp: null,
        pausedRemainingSeconds: t.durationSeconds,
        notificationId: null,
        completedAt: undefined,
      };
    });

    setTimers(updated);
    saveCloudTimers(updated);
  }, []);

  // Mark as Taken (Logs to history, resets or auto-repeats if configured)
  const markAsTaken = useCallback(async (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const timer = timersRef.current.find((t) => t.id === id);
    if (!timer) return;

    await cancelMedicationNotification(timer.notificationId);

    // Record to history
    const logEntry: MedicationLogEntry = {
      id: `log-${Date.now()}`,
      timerId: timer.id,
      name: timer.name,
      note: timer.note,
      category: timer.category,
      takenAt: Date.now(),
    };

    const updatedHistory = [logEntry, ...history];
    setHistory(updatedHistory);
    saveCloudHistory(updatedHistory);

    // If timer has auto-repeat interval, restart it!
    let updatedTimers: CountdownTimer[];
    if (timer.repeatEveryHours && timer.repeatEveryHours > 0) {
      const repeatSeconds = timer.repeatEveryHours * 3600;
      const targetTimestamp = Date.now() + repeatSeconds * 1000;

      const notificationId = await scheduleMedicationNotification(
        timer.id,
        timer.name,
        timer.note,
        repeatSeconds
      );

      updatedTimers = timersRef.current.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          durationSeconds: repeatSeconds,
          status: 'running' as const,
          targetTimestamp,
          pausedRemainingSeconds: repeatSeconds,
          notificationId,
          completedAt: undefined,
        };
      });
    } else {
      updatedTimers = timersRef.current.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          status: 'paused' as const,
          targetTimestamp: null,
          pausedRemainingSeconds: t.durationSeconds,
          notificationId: null,
          completedAt: undefined,
        };
      });
    }

    setTimers(updatedTimers);
    saveCloudTimers(updatedTimers);
  }, [history]);

  // Delete timer
  const deleteTimer = useCallback(async (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const timer = timersRef.current.find((t) => t.id === id);
    if (timer) {
      await cancelMedicationNotification(timer.notificationId);
    }

    const updated = timersRef.current.filter((t) => t.id !== id);
    setTimers(updated);
    saveCloudTimers(updated);
  }, []);

  // Clear all taken history
  const clearHistory = useCallback(async () => {
    setHistory([]);
    saveCloudHistory([]);
  }, []);

  return {
    timers,
    history,
    isLoaded,
    isCloudSynced,
    currentTime,
    addTimer,
    pauseTimer,
    resumeTimer,
    snoozeTimer,
    resetTimer,
    markAsTaken,
    deleteTimer,
    clearHistory,
  };
}

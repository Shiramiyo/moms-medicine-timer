export function formatSecondsToDigital(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00';
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatHumanDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const isYesterday =
    new Date(now.getTime() - 24 * 60 * 60 * 1000).getDate() === date.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const timeStr = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) {
    return `Today at ${timeStr}`;
  }
  if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
  return `${dateStr} at ${timeStr}`;
}

export function calculateRemainingSeconds(
  status: 'running' | 'paused' | 'completed',
  targetTimestamp: number | null,
  pausedRemainingSeconds: number
): number {
  if (status === 'completed') return 0;
  if (status === 'paused') return pausedRemainingSeconds;
  if (!targetTimestamp) return 0;

  const remainingMs = targetTimestamp - Date.now();
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / 1000);
}

export function calculateProgress(
  durationSeconds: number,
  remainingSeconds: number
): number {
  if (durationSeconds <= 0) return 1;
  const elapsed = durationSeconds - remainingSeconds;
  const progress = elapsed / durationSeconds;
  return Math.min(Math.max(progress, 0), 1);
}

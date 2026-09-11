import { Platform } from 'react-native';

let audioCtx: any = null;

export function playAlarmSound() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioCtx) {
        audioCtx = new AudioContextClass();
      }

      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      // Play 3 gentle melodic beeps (A5 - C#6 - E6)
      const notes = [880, 1108.73, 1318.51];
      const now = audioCtx.currentTime;

      notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.18);

        gain.gain.setValueAtTime(0.3, now + index * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.18 + 0.35);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + index * 0.18);
        osc.stop(now + index * 0.18 + 0.4);
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }
}

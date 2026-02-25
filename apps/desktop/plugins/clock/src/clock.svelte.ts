/**
 * Shared Clock State
 *
 * Single source of truth for all clock-related state.
 * Used by both ClockApp (full window) and ClockWidget (desktop widget).
 */

// ============================================================================
// Types
// ============================================================================

export interface Alarm {
  id: string;
  time: string; // HH:MM format
  label: string;
  enabled: boolean;
  days: number[]; // 0-6 for Sun-Sat, empty = one-time
  sound: 'chime' | 'bell' | 'digital' | 'gentle';
  snoozed?: boolean;
  snoozeUntil?: number;
}

export interface Timer {
  id: string;
  duration: number; // total seconds
  remaining: number; // seconds remaining
  isRunning: boolean;
  label: string;
  startedAt?: number;
}

export interface StopwatchLap {
  number: number;
  time: number; // milliseconds
  delta: number; // difference from previous lap
}

export interface WorldClock {
  id: string;
  city: string;
  timezone: string;
  offset: number; // hours from local
}

export type ClockFace = 'digital' | 'analog' | 'minimal' | 'flip';

export interface ClockSettings {
  use24Hour: boolean;
  showSeconds: boolean;
  clockFace: ClockFace;
  primaryTimezone: string;
  worldClocks: WorldClock[];
  alarmVolume: number;
  theme: 'auto' | 'light' | 'dark';
}

export interface ClockState {
  // Current time (updated every second)
  now: Date;

  // Alarms
  alarms: Alarm[];
  activeAlarm: Alarm | null;

  // Timer
  timers: Timer[];

  // Stopwatch
  stopwatchTime: number; // milliseconds
  stopwatchRunning: boolean;
  stopwatchLaps: StopwatchLap[];

  // Settings
  settings: ClockSettings;

  // UI State
  activeTab: 'clock' | 'alarm' | 'timer' | 'stopwatch' | 'world';
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_SETTINGS: ClockSettings = {
  use24Hour: false,
  showSeconds: true,
  clockFace: 'digital',
  primaryTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  worldClocks: [
    { id: '1', city: 'New York', timezone: 'America/New_York', offset: 0 },
    { id: '2', city: 'London', timezone: 'Europe/London', offset: 0 },
    { id: '3', city: 'Tokyo', timezone: 'Asia/Tokyo', offset: 0 },
  ],
  alarmVolume: 0.7,
  theme: 'auto',
};

const STORAGE_KEY = 'rdtect-os-clock-state';

// ============================================================================
// State Factory
// ============================================================================

function loadPersistedState(): Partial<ClockState> {
  if (typeof localStorage === 'undefined') return {};

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        alarms: parsed.alarms || [],
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      };
    }
  } catch (e) {
    console.warn('[Clock] Failed to load persisted state:', e);
  }
  return {};
}

function persistState(state: ClockState) {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      alarms: state.alarms,
      settings: state.settings,
    }));
  } catch (e) {
    console.warn('[Clock] Failed to persist state:', e);
  }
}

// ============================================================================
// Reactive State (Svelte 5 Runes)
// ============================================================================

function createClockState() {
  const persisted = loadPersistedState();

  // Core state using $state
  let now = $state(new Date());
  let alarms = $state<Alarm[]>(persisted.alarms || []);
  let activeAlarm = $state<Alarm | null>(null);
  let timers = $state<Timer[]>([]);
  let stopwatchTime = $state(0);
  let stopwatchRunning = $state(false);
  let stopwatchLaps = $state<StopwatchLap[]>([]);
  let settings = $state<ClockSettings>(persisted.settings || DEFAULT_SETTINGS);
  let activeTab = $state<ClockState['activeTab']>('clock');

  // Internal refs
  let clockInterval: ReturnType<typeof setInterval> | null = null;
  let stopwatchInterval: ReturnType<typeof setInterval> | null = null;
  let stopwatchStartTime = 0;
  let stopwatchAccumulated = 0;

  // Start clock
  function startClock() {
    if (clockInterval) return;
    clockInterval = setInterval(() => {
      now = new Date();
      checkAlarms();
      updateTimers();
    }, 1000);
  }

  // Check for triggered alarms
  function checkAlarms() {
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentDay = now.getDay();
    const currentSeconds = now.getSeconds();

    // Only check at second 0 to avoid repeated triggers
    if (currentSeconds !== 0) return;

    for (const alarm of alarms) {
      if (!alarm.enabled) continue;
      if (alarm.snoozed && alarm.snoozeUntil && Date.now() < alarm.snoozeUntil) continue;

      const shouldTrigger = alarm.time === currentTime &&
        (alarm.days.length === 0 || alarm.days.includes(currentDay));

      if (shouldTrigger) {
        activeAlarm = { ...alarm, snoozed: false };
        playAlarmSound(alarm.sound);
        break;
      }
    }
  }

  // Update running timers
  function updateTimers() {
    timers = timers.map(timer => {
      if (!timer.isRunning || timer.remaining <= 0) return timer;

      const newRemaining = timer.remaining - 1;
      if (newRemaining <= 0) {
        playAlarmSound('digital');
      }

      return { ...timer, remaining: Math.max(0, newRemaining) };
    });
  }

  // Play alarm sound
  function playAlarmSound(sound: Alarm['sound']) {
    // Create audio context for alarm
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.value = settings.alarmVolume * 0.3;

      switch (sound) {
        case 'chime':
          oscillator.frequency.value = 880;
          oscillator.type = 'sine';
          break;
        case 'bell':
          oscillator.frequency.value = 660;
          oscillator.type = 'triangle';
          break;
        case 'digital':
          oscillator.frequency.value = 1000;
          oscillator.type = 'square';
          break;
        case 'gentle':
          oscillator.frequency.value = 440;
          oscillator.type = 'sine';
          break;
      }

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        ctx.close();
      }, 500);
    } catch (e) {
      console.warn('[Clock] Failed to play alarm sound:', e);
    }
  }

  // Initialize
  startClock();

  // Return reactive state and actions
  return {
    // Getters (reactive)
    get now() { return now; },
    get alarms() { return alarms; },
    get activeAlarm() { return activeAlarm; },
    get timers() { return timers; },
    get stopwatchTime() { return stopwatchTime; },
    get stopwatchRunning() { return stopwatchRunning; },
    get stopwatchLaps() { return stopwatchLaps; },
    get settings() { return settings; },
    get activeTab() { return activeTab; },

    // Derived values
    get nextAlarm(): Alarm | null {
      const enabledAlarms = alarms.filter(a => a.enabled);
      if (enabledAlarms.length === 0) return null;

      // Simple: return first enabled alarm (could sort by time)
      return enabledAlarms[0];
    },

    get formattedTime(): string {
      const hours = settings.use24Hour ? now.getHours() : now.getHours() % 12 || 12;
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = settings.showSeconds ? `:${String(now.getSeconds()).padStart(2, '0')}` : '';
      const period = settings.use24Hour ? '' : (now.getHours() >= 12 ? ' PM' : ' AM');
      return `${hours}:${mins}${secs}${period}`;
    },

    // Actions
    setActiveTab(tab: ClockState['activeTab']) {
      activeTab = tab;
    },

    // Alarm actions
    addAlarm(alarm: Omit<Alarm, 'id'>) {
      const newAlarm: Alarm = {
        ...alarm,
        id: crypto.randomUUID(),
      };
      alarms = [...alarms, newAlarm];
      persistState(this.getState());
    },

    updateAlarm(id: string, updates: Partial<Alarm>) {
      alarms = alarms.map(a => a.id === id ? { ...a, ...updates } : a);
      persistState(this.getState());
    },

    deleteAlarm(id: string) {
      alarms = alarms.filter(a => a.id !== id);
      persistState(this.getState());
    },

    toggleAlarm(id: string) {
      alarms = alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
      persistState(this.getState());
    },

    dismissAlarm() {
      activeAlarm = null;
    },

    snoozeAlarm(minutes: number = 5) {
      if (!activeAlarm) return;

      alarms = alarms.map(a =>
        a.id === activeAlarm!.id
          ? { ...a, snoozed: true, snoozeUntil: Date.now() + minutes * 60 * 1000 }
          : a
      );
      activeAlarm = null;
    },

    // Timer actions
    addTimer(label: string, duration: number) {
      const newTimer: Timer = {
        id: crypto.randomUUID(),
        label,
        duration,
        remaining: duration,
        isRunning: false,
      };
      timers = [...timers, newTimer];
    },

    startTimer(id: string) {
      timers = timers.map(t => t.id === id ? { ...t, isRunning: true, startedAt: Date.now() } : t);
    },

    pauseTimer(id: string) {
      timers = timers.map(t => t.id === id ? { ...t, isRunning: false } : t);
    },

    resetTimer(id: string) {
      timers = timers.map(t => t.id === id ? { ...t, remaining: t.duration, isRunning: false } : t);
    },

    deleteTimer(id: string) {
      timers = timers.filter(t => t.id !== id);
    },

    // Stopwatch actions
    startStopwatch() {
      if (stopwatchRunning) return;

      stopwatchRunning = true;
      stopwatchStartTime = Date.now();

      stopwatchInterval = setInterval(() => {
        stopwatchTime = stopwatchAccumulated + (Date.now() - stopwatchStartTime);
      }, 10);
    },

    stopStopwatch() {
      if (!stopwatchRunning) return;

      stopwatchRunning = false;
      stopwatchAccumulated = stopwatchTime;

      if (stopwatchInterval) {
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
      }
    },

    resetStopwatch() {
      this.stopStopwatch();
      stopwatchTime = 0;
      stopwatchAccumulated = 0;
      stopwatchLaps = [];
    },

    lapStopwatch() {
      if (!stopwatchRunning) return;

      const lapTime = stopwatchTime;
      const prevLap = stopwatchLaps[0]?.time || 0;

      stopwatchLaps = [{
        number: stopwatchLaps.length + 1,
        time: lapTime,
        delta: lapTime - prevLap,
      }, ...stopwatchLaps];
    },

    // Settings actions
    updateSettings(updates: Partial<ClockSettings>) {
      settings = { ...settings, ...updates };
      persistState(this.getState());
    },

    setClockFace(face: ClockFace) {
      settings = { ...settings, clockFace: face };
      persistState(this.getState());
    },

    // Utility
    getState(): ClockState {
      return {
        now,
        alarms,
        activeAlarm,
        timers,
        stopwatchTime,
        stopwatchRunning,
        stopwatchLaps,
        settings,
        activeTab,
      };
    },

    // Cleanup
    destroy() {
      if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
      }
      if (stopwatchInterval) {
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
      }
    },
  };
}

// ============================================================================
// Singleton Export
// ============================================================================

export const clockState = createClockState();

// Helper functions
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

export function formatTimerDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

export function getTimeInTimezone(timezone: string): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '0';

  return new Date(
    parseInt(get('year')),
    parseInt(get('month')) - 1,
    parseInt(get('day')),
    parseInt(get('hour')),
    parseInt(get('minute')),
    parseInt(get('second'))
  );
}

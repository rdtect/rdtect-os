/**
 * Unified Clock Module
 *
 * Exports the ClockApp (full window), ClockWidget (desktop widget),
 * and shared state.
 */

// Shared state (singleton)
export {
  clockState,
  formatTime,
  formatTimerDuration,
  getTimeInTimezone,
  type Alarm,
  type Timer,
  type StopwatchLap,
  type WorldClock,
  type ClockFace,
  type ClockSettings,
  type ClockState,
} from './clock.svelte';

// Components
export { default as ClockApp } from './ClockApp.svelte';
export { default as ClockWidget } from './ClockWidget.svelte';

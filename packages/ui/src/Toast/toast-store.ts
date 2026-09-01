/**
 * Toast — O1 Design System
 *
 * Lightweight toast notification store built on Svelte's writable store.
 *
 * Usage:
 *   import { pushToast } from './toast-store';
 *   pushToast({ title: 'Saved', kind: 'success' });
 *
 * Toasts auto-dismiss after `duration` ms (default 4000, 0 = sticky).
 */
import { writable } from 'svelte/store';
import type { ToastKind, ToastOptions } from '../types';

export interface Toast extends ToastOptions {
  id: number;
}

let nextId = 1;

/** Live list of active toasts (newest last). */
export const toasts = writable<Toast[]>([]);

/**
 * Push a new toast and return its id. Auto-dismisses after `duration`
 * unless duration is 0 (sticky).
 */
export function pushToast(options: ToastOptions = {}): number {
  const id = nextId++;
  const toast: Toast = {
    id,
    kind: options.kind ?? 'info',
    title: options.title,
    message: options.message,
    duration: options.duration ?? 4000,
  };
  toasts.update((list) => [...list, toast]);
  if (toast.duration && toast.duration > 0) {
    setTimeout(() => dismissToast(id), toast.duration);
  }
  return id;
}

/** Dismiss a toast by id. */
export function dismissToast(id: number): void {
  toasts.update((list) => list.filter((t) => t.id !== id));
}

/** Clear all toasts. */
export function clearToasts(): void {
  toasts.set([]);
}

/** Kind → role mapping: errors announce as alerts, everything else as status. */
export function toastRole(kind: ToastKind): 'alert' | 'status' {
  return kind === 'error' ? 'alert' : 'status';
}

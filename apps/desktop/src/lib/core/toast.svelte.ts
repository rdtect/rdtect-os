/**
 * Toast notification system — reactive singleton
 *
 * Usage:
 *   import { toast } from '$lib/core/toast.svelte';
 *   toast.success('Saved!');
 *   toast.error('Something went wrong');
 *   toast.show('Hello', 'info');
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  createdAt: number;
}

const MAX_VISIBLE = 4;
const DEFAULT_DURATION = 3000;

class ToastManager {
  items = $state<ToastItem[]>([]);

  show(message: string, type: ToastType = 'info', duration = DEFAULT_DURATION): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const item: ToastItem = { id, message, type, createdAt: Date.now() };

    // Trim to max visible
    if (this.items.length >= MAX_VISIBLE) {
      this.items = [...this.items.slice(1), item];
    } else {
      this.items = [...this.items, item];
    }

    // Auto-dismiss
    setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  dismiss(id: string): void {
    this.items = this.items.filter(t => t.id !== id);
  }
}

export const toast = new ToastManager();

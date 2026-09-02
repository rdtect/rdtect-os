/**
 * Toast — O1 Design System
 *
 * Tests for the toast store (push/dismiss/auto-dismiss) and the
 * Toast/ToastContainer rendering.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import {
  toasts,
  pushToast,
  dismissToast,
  clearToasts,
  toastRole,
} from './toast-store';
import Toast from './Toast.svelte';
import ToastContainer from './ToastContainer.svelte';

beforeEach(() => {
  clearToasts();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('toast-store', () => {
  it('pushes a toast and exposes it in the store', () => {
    const id = pushToast({ title: 'Saved', message: 'All good', kind: 'success' });
    let list: unknown[] = [];
    const unsub = toasts.subscribe((t) => (list = t));
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id,
      title: 'Saved',
      message: 'All good',
      kind: 'success',
    });
    unsub();
  });

  it('defaults kind to info and duration to 4000', () => {
    pushToast({ title: 'Hey' });
    let list: { kind?: string; duration?: number }[] = [];
    const unsub = toasts.subscribe((t) => (list = t));
    expect(list[0].kind).toBe('info');
    expect(list[0].duration).toBe(4000);
    unsub();
  });

  it('auto-dismisses after duration using a timer', () => {
    vi.useFakeTimers();
    pushToast({ title: 'Temp', duration: 100 });
    let list: unknown[] = [];
    const unsub = toasts.subscribe((t) => (list = t));
    expect(list).toHaveLength(1);
    vi.advanceTimersByTime(150);
    expect(list).toHaveLength(0);
    unsub();
  });

  it('keeps sticky toasts (duration=0) until dismissed', () => {
    vi.useFakeTimers();
    pushToast({ title: 'Sticky', duration: 0 });
    let list: unknown[] = [];
    const unsub = toasts.subscribe((t) => (list = t));
    vi.advanceTimersByTime(60_000);
    expect(list).toHaveLength(1);
    unsub();
  });

  it('dismisses a toast by id', () => {
    const a = pushToast({ title: 'A' });
    const b = pushToast({ title: 'B' });
    dismissToast(a);
    let list: { id: number }[] = [];
    const unsub = toasts.subscribe((t) => (list = t));
    expect(list.map((t) => t.id)).toEqual([b]);
    unsub();
  });

  it('clearToasts empties the queue', () => {
    pushToast({ title: 'A' });
    pushToast({ title: 'B' });
    clearToasts();
    let list: unknown[] = [null];
    const unsub = toasts.subscribe((t) => (list = t));
    expect(list).toHaveLength(0);
    unsub();
  });

  it('maps error to alert role and others to status', () => {
    expect(toastRole('error')).toBe('alert');
    expect(toastRole('info')).toBe('status');
    expect(toastRole('success')).toBe('status');
    expect(toastRole('warning')).toBe('status');
  });
});

describe('Toast item', () => {
  it('renders title and message', () => {
    render(Toast, {
      props: { toast: { id: 1, kind: 'info', title: 'Saved', message: 'Done', duration: 4000 } },
    });
    expect(screen.getByText('Saved')).toBeDefined();
    expect(screen.getByText('Done')).toBeDefined();
  });

  it('uses role=alert for error toasts', () => {
    const { container } = render(Toast, {
      props: { toast: { id: 1, kind: 'error', title: 'Failed', duration: 4000 } },
    });
    expect(container.querySelector('[role="alert"]')).toBeDefined();
  });

  it('uses role=status for non-error toasts', () => {
    const { container } = render(Toast, {
      props: { toast: { id: 1, kind: 'success', title: 'OK', duration: 4000 } },
    });
    expect(container.querySelector('[role="status"]')).toBeDefined();
  });

  it('applies kind-specific accent classes', () => {
    const { container } = render(Toast, {
      props: { toast: { id: 1, kind: 'success', title: 'OK', duration: 4000 } },
    });
    const li = container.querySelector('li')!;
    expect(li.className).toContain('border-desktop-success');
  });

  it('fires ondismiss with the toast id', async () => {
    const user = userEvent.setup();
    const ondismiss = vi.fn();
    render(Toast, {
      props: {
        toast: { id: 42, kind: 'info', title: 'Hi', duration: 4000 },
        ondismiss,
      },
    });
    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(ondismiss).toHaveBeenCalledWith(42);
  });
});

describe('ToastContainer', () => {
  it('renders nothing when the store is empty', () => {
    const { container } = render(ToastContainer);
    expect(container.querySelector('[role="region"]')).toBeNull();
  });

  it('renders all active toasts', () => {
    pushToast({ title: 'One' });
    pushToast({ title: 'Two' });
    render(ToastContainer);
    expect(screen.getByText('One')).toBeDefined();
    expect(screen.getByText('Two')).toBeDefined();
  });

  it('dismisses a toast via the container dismiss button', async () => {
    const user = userEvent.setup();
    pushToast({ title: 'Bye', duration: 0 });
    render(ToastContainer);
    const buttons = screen.getAllByRole('button', { name: 'Dismiss notification' });
    expect(buttons).toHaveLength(1);
    await user.click(buttons[0]);
    await waitFor(() => {
      expect(screen.queryByText('Bye')).toBeNull();
    });
  });

  it('applies position class', () => {
    pushToast({ title: 'Pos' });
    const { container } = render(ToastContainer, { props: { position: 'top-right' } });
    const region = container.querySelector('[role="region"]')!;
    expect(region.className).toContain('top-4');
    expect(region.className).toContain('right-4');
  });

  it('applies a custom zIndex class to the toast layer', () => {
    pushToast({ title: 'Layer' });
    const { container } = render(ToastContainer, { props: { zIndex: 'z-[9999]' } });
    const region = container.querySelector('[role="region"]')!;
    expect(region.className).toContain('z-[9999]');
  });
});

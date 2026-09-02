/**
 * desktop-confirmations — destructive desktop flow gatekeeping
 *
 * The shell's destructive context-menu actions (Remove from Desktop,
 * Reset Icon Positions, Reset Widget Positions) must not execute until the
 * danger ConfirmDialog is accepted. These tests pin the confirmation copy
 * and the dispatch of each accepted action to its destructive dependency —
 * and only its own.
 */
import { describe, it, expect, vi } from 'vitest';
import type { AppDefinition } from './types';
import {
  confirmMeta,
  executeConfirmedAction,
  type DesktopConfirmAction,
  type DesktopConfirmActions,
} from './desktop-confirmations';

const app = { id: 'clock', title: 'Clock' } as AppDefinition;

function makeDeps() {
  return {
    hideDesktopIcon: vi.fn(),
    resetIconPositions: vi.fn(),
    resetWidgetPositions: vi.fn(),
    notify: vi.fn(),
  } satisfies DesktopConfirmActions;
}

describe('confirmMeta', () => {
  it('names the app for remove-from-desktop and labels the button Remove', () => {
    const meta = confirmMeta({ kind: 'remove-from-desktop', app });
    expect(meta.title).toContain('Clock');
    expect(meta.confirmLabel).toBe('Remove');
    expect(meta.description).toContain('Show All Desktop Icons');
  });

  it('warns that the custom grid is lost for reset-icon-positions', () => {
    const meta = confirmMeta({ kind: 'reset-icon-positions' });
    expect(meta.title).toBe('Reset desktop icon positions?');
    expect(meta.confirmLabel).toBe('Reset positions');
    expect(meta.description.toLowerCase()).toContain('lost');
  });

  it('warns for reset-widget-positions', () => {
    const meta = confirmMeta({ kind: 'reset-widget-positions' });
    expect(meta.title).toBe('Reset widget positions?');
    expect(meta.confirmLabel).toBe('Reset positions');
    expect(meta.description.toLowerCase()).toContain('lost');
  });
});

describe('executeConfirmedAction', () => {
  it('hides the desktop icon and toasts for remove-from-desktop', () => {
    const deps = makeDeps();
    executeConfirmedAction({ kind: 'remove-from-desktop', app }, deps);

    expect(deps.hideDesktopIcon).toHaveBeenCalledExactlyOnceWith('clock');
    expect(deps.notify).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ kind: 'info', title: 'Removed from desktop' }),
    );
    expect(deps.resetIconPositions).not.toHaveBeenCalled();
    expect(deps.resetWidgetPositions).not.toHaveBeenCalled();
  });

  it('resets icon positions (and nothing else) for reset-icon-positions', () => {
    const deps = makeDeps();
    executeConfirmedAction({ kind: 'reset-icon-positions' }, deps);

    expect(deps.resetIconPositions).toHaveBeenCalledTimes(1);
    expect(deps.notify).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ title: 'Icon positions reset' }),
    );
    expect(deps.hideDesktopIcon).not.toHaveBeenCalled();
    expect(deps.resetWidgetPositions).not.toHaveBeenCalled();
  });

  it('resets widget positions (and nothing else) for reset-widget-positions', () => {
    const deps = makeDeps();
    executeConfirmedAction({ kind: 'reset-widget-positions' }, deps);

    expect(deps.resetWidgetPositions).toHaveBeenCalledTimes(1);
    expect(deps.notify).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ title: 'Widget positions reset' }),
    );
    expect(deps.hideDesktopIcon).not.toHaveBeenCalled();
    expect(deps.resetIconPositions).not.toHaveBeenCalled();
  });
});

// Compile-time guard: every DesktopConfirmAction kind has copy + a dispatch.
const kinds: DesktopConfirmAction['kind'][] = [
  'remove-from-desktop',
  'reset-icon-positions',
  'reset-widget-positions',
];

describe('action kinds covered', () => {
  it.each(kinds)('has meta copy for %s', (kind) => {
    const action: DesktopConfirmAction =
      kind === 'remove-from-desktop' ? { kind, app } : { kind };
    const meta = confirmMeta(action);
    expect(meta.title.length).toBeGreaterThan(0);
    expect(meta.description.length).toBeGreaterThan(0);
    expect(meta.confirmLabel.length).toBeGreaterThan(0);
  });
});

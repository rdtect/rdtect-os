/**
 * AppInfoModal — Shell usage pattern for the O1 Dialog
 *
 * Verifies the AppInfoModal composes the O1 Dialog (rather than a
 * hand-rolled modal): Dialog-owned Escape/backdrop/close behavior,
 * aria-labelledby wiring, and the shell layering z-index.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { Component } from 'svelte';
import AppInfoModal from './AppInfoModal.svelte';
import type { AppDefinition } from './types';

const fakeApp: AppDefinition = {
  id: 'clock',
  title: 'Clock',
  icon: '🕐',
  pluginType: 'native',
  type: 'component',
  plugin: {
    manifest: {
      id: 'clock',
      name: 'Clock',
      version: '1.2.3',
      type: 'native',
      icon: '🕐',
    },
    type: 'native',
    render: { kind: 'component', component: {} as Component },
  },
};

function renderModal(props: Partial<{ app: AppDefinition; view: 'source' | 'architecture' | 'docs'; onClose: () => void }> = {}) {
  return render(AppInfoModal, {
    props: {
      app: fakeApp,
      view: 'source',
      onClose: () => {},
      ...props,
    },
  });
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('AppInfoModal (Dialog composition)', () => {
  it('renders as an O1 dialog with the app title and aria wiring', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(document.getElementById(labelledBy!)?.textContent).toContain('Clock');
  });

  it('stacks above the window manager layer (z-[9999])', () => {
    const { container } = renderModal();
    const backdrop = container.querySelector('[role="presentation"]')!;
    expect(backdrop.className).toContain('z-[9999]');
  });

  it('shows the plugin type badge and version', () => {
    renderModal();
    expect(screen.getByText('Native')).toBeDefined();
    expect(screen.getByText('v1.2.3')).toBeDefined();
  });

  it('switches tabs when the user clicks the tab bar', async () => {
    const user = userEvent.setup();
    renderModal();
    expect(screen.getByText('Source File')).toBeDefined();
    await user.click(screen.getByRole('button', { name: 'Architecture' }));
    expect(screen.getByText('Loading Method')).toBeDefined();
    await user.click(screen.getByRole('button', { name: 'Documentation' }));
    expect(screen.getByText('How to Use')).toBeDefined();
  });

  it('closes via the Dialog close button (onClose)', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal({ onClose });
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes via the footer Close button (onClose)', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal({ onClose });
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes via Escape (Dialog-owned)', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal({ onClose });
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes via backdrop click (Dialog-owned)', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = renderModal({ onClose });
    const backdrop = container.querySelector('[role="presentation"]')!;
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

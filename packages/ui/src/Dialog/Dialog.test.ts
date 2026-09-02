/**
 * Dialog — O1 Design System
 *
 * Tests for the Dialog (modal) component: rendering, Escape close,
 * backdrop close, focus trap, focus restore, and aria wiring.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Dialog from './Dialog.svelte';

function renderOpen(props: Record<string, unknown> = {}) {
  return render(Dialog, { props: { open: true, title: 'Settings', ...props } });
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('Dialog', () => {
  it('renders a modal dialog with title when open', () => {
    renderOpen();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('does not render anything when closed', () => {
    render(Dialog, { props: { title: 'Settings' } });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('wires aria-labelledby to the title', () => {
    renderOpen({ title: 'Confirm delete' });
    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    const titleEl = document.getElementById(labelledBy!);
    expect(titleEl?.textContent).toContain('Confirm delete');
  });

  it('wires aria-describedby to the description', () => {
    renderOpen({ description: 'This action cannot be undone.' });
    const dialog = screen.getByRole('dialog');
    const describedBy = dialog.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toContain(
      'This action cannot be undone.'
    );
  });

  it('renders a header with the title inside the panel', () => {
    const { container } = renderOpen({ title: 'Dialog' });
    const panel = container.querySelector('[role="dialog"]')!;
    expect(panel.querySelector('header')).toBeDefined();
    expect(panel.querySelector('h2')?.textContent).toContain('Dialog');
  });

  it('moves focus into the dialog on open', () => {
    renderOpen();
    const dialog = screen.getByRole('dialog');
    // Effect runs synchronously after mount in Svelte 5
    expect(document.activeElement).toBe(dialog);
  });

  it('fires onclose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onclose = vi.fn();
    renderOpen({ onclose });
    await user.keyboard('{Escape}');
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('does not fire onclose on Escape when closeOnEscape=false', async () => {
    const user = userEvent.setup();
    const onclose = vi.fn();
    renderOpen({ onclose, closeOnEscape: false });
    await user.keyboard('{Escape}');
    expect(onclose).not.toHaveBeenCalled();
  });

  it('fires onclose when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onclose = vi.fn();
    const { container } = renderOpen({ onclose });
    // The backdrop is the outermost fixed overlay wrapping the panel
    const overlay = container.firstElementChild as HTMLElement;
    await user.click(overlay);
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('does not fire onclose when the panel is clicked', async () => {
    const user = userEvent.setup();
    const onclose = vi.fn();
    renderOpen({ onclose });
    const dialog = screen.getByRole('dialog');
    await user.click(dialog);
    expect(onclose).not.toHaveBeenCalled();
  });

  it('does not close on backdrop when closeOnBackdrop=false', async () => {
    const user = userEvent.setup();
    const onclose = vi.fn();
    const { container } = renderOpen({ onclose, closeOnBackdrop: false });
    const overlay = container.firstElementChild as HTMLElement;
    await user.click(overlay);
    expect(onclose).not.toHaveBeenCalled();
  });

  it('fires onclose via the close button', async () => {
    const user = userEvent.setup();
    const onclose = vi.fn();
    renderOpen({ onclose });
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('hides the close button when closable=false', () => {
    renderOpen({ closable: false });
    expect(screen.queryByRole('button', { name: 'Close dialog' })).toBeNull();
  });

  it('traps focus within the dialog (Tab wraps from last to first)', async () => {
    const user = userEvent.setup();
    const { container } = renderOpen({ title: 'Form', closable: false });
    // Add two focusable elements inside the dialog
    const dialog = screen.getByRole('dialog');
    const first = document.createElement('button');
    first.textContent = 'First';
    const second = document.createElement('button');
    second.textContent = 'Second';
    dialog.appendChild(first);
    dialog.appendChild(second);
    void container;

    first.focus();
    await user.tab();
    expect(document.activeElement).toBe(second);
    await user.tab();
    expect(document.activeElement).toBe(first);
  });

  it('traps focus backwards (Shift+Tab from first to last)', async () => {
    const user = userEvent.setup();
    const { container } = renderOpen({ title: 'Form', closable: false });
    const dialog = screen.getByRole('dialog');
    const first = document.createElement('button');
    first.textContent = 'First';
    const second = document.createElement('button');
    second.textContent = 'Second';
    dialog.appendChild(first);
    dialog.appendChild(second);
    void container;

    first.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(second);
  });

  it('applies size preset class', () => {
    const { container } = renderOpen({ size: 'lg' });
    const dialog = container.querySelector('[role="dialog"]')!;
    expect(dialog.className).toContain('max-w-lg');
  });

  it('generates a stable id from the title', () => {
    renderOpen({ title: 'Delete Project' });
    expect(screen.getByRole('dialog').getAttribute('aria-labelledby')).toBe(
      'dialog-delete-project-title'
    );
  });

  it('uses a custom id when provided', () => {
    renderOpen({ id: 'my-dialog', title: 'Thing' });
    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBe('my-dialog-title');
  });

  it('applies a custom zIndex class to the backdrop layer', () => {
    const { container } = renderOpen({ zIndex: 'z-[9999]' });
    const backdrop = container.querySelector('[role="presentation"]')!;
    expect(backdrop.className).toContain('z-[9999]');
  });

  it('defaults the backdrop layer to z-50', () => {
    const { container } = renderOpen();
    const backdrop = container.querySelector('[role="presentation"]')!;
    expect(backdrop.className).toContain('z-50');
  });
});

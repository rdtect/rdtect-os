/**
 * ConfirmDialog — O1 Design System
 *
 * Tests for the confirm-dialog composition pattern (Dialog + Button).
 * Verifies confirm/cancel semantics, the safety property that dismissal
 * paths (Escape/backdrop/close) never fire `onconfirm`, danger styling,
 * disabled confirm state, focus placement, and aria wiring.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog.svelte';

function renderOpen(props: Record<string, unknown> = {}) {
  return render(ConfirmDialog, {
    props: { open: true, title: 'Delete project', description: 'This cannot be undone.', ...props },
  });
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('ConfirmDialog', () => {
  it('renders a modal dialog with title and description when open', () => {
    renderOpen();
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('Delete project')).toBeDefined();
    expect(screen.getByText('This cannot be undone.')).toBeDefined();
  });

  it('renders nothing when closed', () => {
    render(ConfirmDialog, { props: { title: 'Delete project' } });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('wires aria-labelledby and aria-describedby through to Dialog', () => {
    renderOpen();
    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    const describedBy = dialog.getAttribute('aria-describedby');
    expect(document.getElementById(labelledBy!)?.textContent).toContain('Delete project');
    expect(document.getElementById(describedBy!)?.textContent).toContain(
      'This cannot be undone.'
    );
  });

  it('uses default Confirm / Cancel labels', () => {
    renderOpen();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDefined();
  });

  it('renders custom labels', () => {
    renderOpen({ confirmLabel: 'Delete', cancelLabel: 'Keep' });
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Keep' })).toBeDefined();
  });

  it('fires onconfirm then onclose when the confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onconfirm = vi.fn();
    const onclose = vi.fn();
    renderOpen({ onconfirm, onclose });
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onconfirm).toHaveBeenCalledTimes(1);
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('fires only onclose when the cancel button is clicked (never onconfirm)', async () => {
    const user = userEvent.setup();
    const onconfirm = vi.fn();
    const onclose = vi.fn();
    renderOpen({ onconfirm, onclose });
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onclose).toHaveBeenCalledTimes(1);
    expect(onconfirm).not.toHaveBeenCalled();
  });

  it('fires only onclose on Escape (never onconfirm) — destructive safety', async () => {
    const user = userEvent.setup();
    const onconfirm = vi.fn();
    const onclose = vi.fn();
    renderOpen({ onconfirm, onclose });
    await user.keyboard('{Escape}');
    expect(onclose).toHaveBeenCalledTimes(1);
    expect(onconfirm).not.toHaveBeenCalled();
  });

  it('fires only onclose on backdrop click (never onconfirm) — destructive safety', async () => {
    const user = userEvent.setup();
    const onconfirm = vi.fn();
    const onclose = vi.fn();
    const { container } = renderOpen({ onconfirm, onclose });
    const overlay = container.firstElementChild as HTMLElement;
    await user.click(overlay);
    expect(onclose).toHaveBeenCalledTimes(1);
    expect(onconfirm).not.toHaveBeenCalled();
  });

  it('fires only onclose via the close button (never onconfirm)', async () => {
    const user = userEvent.setup();
    const onconfirm = vi.fn();
    const onclose = vi.fn();
    renderOpen({ onconfirm, onclose });
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onclose).toHaveBeenCalledTimes(1);
    expect(onconfirm).not.toHaveBeenCalled();
  });

  it('does not close on Escape when closeOnEscape=false', async () => {
    const user = userEvent.setup();
    const onclose = vi.fn();
    renderOpen({ onclose, closeOnEscape: false });
    await user.keyboard('{Escape}');
    expect(onclose).not.toHaveBeenCalled();
  });

  it('styles the confirm button as danger when danger=true', () => {
    renderOpen({ danger: true });
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    expect(confirm.className).toContain('bg-desktop-error');
  });

  it('styles the confirm button as primary by default', () => {
    renderOpen();
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    expect(confirm.className).toContain('bg-desktop-accent');
  });

  it('disables the confirm button when confirmDisabled=true', () => {
    renderOpen({ confirmDisabled: true });
    expect(screen.getByRole('button', { name: 'Confirm' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Cancel' }).hasAttribute('disabled')).toBe(false);
  });

  it('does not fire onconfirm while the confirm button is disabled', async () => {
    const user = userEvent.setup();
    const onconfirm = vi.fn();
    const onclose = vi.fn();
    renderOpen({ confirmDisabled: true, onconfirm, onclose });
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onconfirm).not.toHaveBeenCalled();
    expect(onclose).not.toHaveBeenCalled();
  });

  it('focuses the cancel button on open (safe default for destructive actions)', () => {
    renderOpen({ danger: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('renders extra body content above the actions', () => {
    renderOpen({ children: 'Type DELETE to continue' });
    expect(screen.getByText('Type DELETE to continue')).toBeDefined();
    // Extra content appears before the action buttons in the panel body
    const dialog = screen.getByRole('dialog');
    const text = screen.getByText('Type DELETE to continue');
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    expect(dialog.contains(text)).toBe(true);
    expect(dialog.compareDocumentPosition(cancel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('applies size preset class', () => {
    const { container } = renderOpen({ size: 'sm' });
    expect(container.querySelector('[role="dialog"]')?.className).toContain('max-w-sm');
  });

  it('supports custom id prefix for stable a11y ids', () => {
    renderOpen({ id: 'delete-flow' });
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-labelledby')).toBe('delete-flow-title');
  });

  it('passes a custom zIndex through to the Dialog backdrop', () => {
    const { container } = renderOpen({ zIndex: 'z-[9999]' });
    expect(container.querySelector('[role="presentation"]')?.className).toContain('z-[9999]');
  });
});

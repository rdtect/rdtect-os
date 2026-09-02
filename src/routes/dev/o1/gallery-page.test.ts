/**
 * O1 preview harness (/dev/o1) — page smoke tests
 *
 * Proves the hand-authored gallery page actually renders a live section for
 * every manifest entry (the manifest ⇄ @rdtect/ui direction is guarded in
 * src/lib/o1/gallery-manifest.test.ts), and exercises the two heaviest
 * interactive demos end-to-end: the O1 Dialog (Escape closes) and the danger
 * ConfirmDialog (only the confirm path fires the action → toast).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { clearToasts } from '@rdtect/ui';
import Page from './+page.svelte';
import { O1_GALLERY } from '$lib/o1/gallery-manifest';

/**
 * Mounting the whole gallery (every O1 component + variants) is slow when
 * the full suite runs in parallel — same reason the repo-wide default in
 * vitest.config.ts is 15s. Give these smoke tests explicit headroom.
 */
const PAGE_TEST_TIMEOUT = 30000;

afterEach(() => {
  document.body.innerHTML = '';
  clearToasts();
});

describe('/dev/o1 O1 preview harness', () => {
  it('renders a section with a manifest summary for every gallery entry', () => {
    render(Page);

    for (const entry of O1_GALLERY) {
      const heading = screen.getByRole('heading', { name: entry.name, level: 2 });
      expect(heading).toBeInTheDocument();
      // The section element carries the manifest anchor id.
      expect(document.getElementById(entry.id)).not.toBeNull();
      // Summary comes from the manifest, so copy can never drift.
      expect(heading.parentElement?.textContent).toContain(entry.summary);
    }

    // Static badges in the page header summarise the manifest counts.
    expect(screen.getByText(`${O1_GALLERY.length} components`)).toBeInTheDocument();
  }, PAGE_TEST_TIMEOUT);

  it('opens the O1 Dialog demo, traps modal semantics, and closes on Escape', async () => {
    const user = userEvent.setup();
    render(Page);

    await user.click(screen.getByRole('button', { name: 'Open O1 dialog' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.textContent).toContain('New window');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  }, PAGE_TEST_TIMEOUT);

  it('fires a live toast into the ToastContainer queue', async () => {
    const user = userEvent.setup();
    render(Page);

    await user.click(screen.getByRole('button', { name: 'Fire success toast' }));

    const region = await screen.findByRole('region', { name: 'Notifications' });
    expect(within(region).getByText('Success notification')).toBeInTheDocument();
    expect(within(region).getByText(/Fired from the O1 preview harness/)).toBeInTheDocument();
  }, PAGE_TEST_TIMEOUT);

  it('danger ConfirmDialog: only the confirm button executes the destructive demo', async () => {
    const user = userEvent.setup();
    render(Page);

    // Arm the confirmation — nothing destructive happens yet.
    await user.click(screen.getByRole('button', { name: 'Delete draft (demo)' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('Delete draft?');

    // Dismiss via Cancel: no action toast may appear.
    await user.click(within(dialog).getByRole('button', { name: 'Keep draft' }));
    expect(screen.queryByText('Draft deleted')).not.toBeInTheDocument();

    // Re-arm, then confirm: the action fires (demo toast) and the dialog closes.
    await user.click(screen.getByRole('button', { name: 'Delete draft (demo)' }));
    const dialogAgain = await screen.findByRole('dialog');
    await user.click(within(dialogAgain).getByRole('button', { name: 'Delete draft' }));

    expect(await screen.findByText('Draft deleted')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  }, PAGE_TEST_TIMEOUT);
});

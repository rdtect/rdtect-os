/**
 * Desktop destructive-action confirmations
 *
 * Pure decision/dispatch helpers behind the shell's ConfirmDialog-gated
 * destructive flows (see Desktop.svelte). Kept outside the component so the
 * confirmation copy and the dispatch of each confirmed action are unit
 * testable without rendering the whole desktop.
 *
 * Contract: a destructive context-menu action never executes directly. It
 * arms a `DesktopConfirmAction`; Desktop renders a danger ConfirmDialog; only
 * `executeConfirmedAction` (wired to `onconfirm`) mutates state.
 */
import type { AppDefinition } from './types';

export type DesktopConfirmAction =
  | { kind: 'remove-from-desktop'; app: AppDefinition }
  | { kind: 'reset-icon-positions' }
  | { kind: 'reset-widget-positions' };

export interface DesktopConfirmMeta {
  /** Dialog title (aria-labelledby) */
  title: string;
  /** Dialog body (aria-describedby) */
  description: string;
  /** Danger confirm button label */
  confirmLabel: string;
}

/** Destructive operations the shell performs once a confirmation is accepted. */
export interface DesktopConfirmActions {
  hideDesktopIcon: (appId: string) => void;
  resetIconPositions: () => void;
  resetWidgetPositions: () => void;
  /** Surface a confirmation toast (shell wires this to O1 pushToast). */
  notify: (options: { kind: 'info'; title: string; message: string }) => void;
}

export function confirmMeta(action: DesktopConfirmAction): DesktopConfirmMeta {
  if (action.kind === 'remove-from-desktop') {
    return {
      title: `Remove ${action.app.title} from desktop?`,
      description:
        `"${action.app.title}" will no longer appear on the desktop. ` +
        'You can restore it anytime via “Show All Desktop Icons” in the desktop context menu.',
      confirmLabel: 'Remove',
    };
  }
  if (action.kind === 'reset-icon-positions') {
    return {
      title: 'Reset desktop icon positions?',
      description:
        'All desktop icons will snap back to the default grid. Any custom arrangement will be lost.',
      confirmLabel: 'Reset positions',
    };
  }
  return {
    title: 'Reset widget positions?',
    description:
      'All desktop widgets will return to their default positions. Any custom arrangement will be lost.',
    confirmLabel: 'Reset positions',
  };
}

/**
 * Run the confirmed destructive action. Only ever invoked from the
 * ConfirmDialog `onconfirm` path — never from a dismissal path (Escape,
 * backdrop, close X, or the cancel button), which is enforced by the
 * ConfirmDialog/Dialog semantics in packages/ui.
 */
export function executeConfirmedAction(
  action: DesktopConfirmAction,
  deps: DesktopConfirmActions,
): void {
  if (action.kind === 'remove-from-desktop') {
    deps.hideDesktopIcon(action.app.id);
    deps.notify({
      kind: 'info',
      title: 'Removed from desktop',
      message: `"${action.app.title}" was removed. Use “Show All Desktop Icons” to restore it.`,
    });
    return;
  }
  if (action.kind === 'reset-icon-positions') {
    deps.resetIconPositions();
    deps.notify({
      kind: 'info',
      title: 'Icon positions reset',
      message: 'Desktop icons returned to the default grid.',
    });
    return;
  }
  deps.resetWidgetPositions();
  deps.notify({
    kind: 'info',
    title: 'Widget positions reset',
    message: 'Desktop widgets returned to their default positions.',
  });
}

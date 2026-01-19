// Window Manager exports
export { wm, detectSnapZone, getSnapZoneBounds } from './registry.svelte';
export { default as Desktop } from './Desktop.svelte';
export { default as Window } from './Window.svelte';
export { default as Taskbar } from './Taskbar.svelte';
export { default as DesktopIcons } from './DesktopIcons.svelte';
export { default as ContextMenu } from './ContextMenu.svelte';
export { default as AppLauncher } from './AppLauncher.svelte';
export { default as StartMenu } from './StartMenu.svelte';
export { default as AppInfoModal } from './AppInfoModal.svelte';
export { default as WindowSwitcher } from './WindowSwitcher.svelte';
export { default as FederationOffline } from './FederationOffline.svelte';
export type { AppDefinition, WindowState, SnapZone } from './types';

import type { PluginType } from '$lib/core/types';

/** Badge label + color for each plugin type, used across Taskbar and StartMenu */
export const pluginBadges: Record<PluginType, { label: string; color: string }> = {
  native: { label: 'Native', color: 'bg-emerald-500' },
  webcomponent: { label: 'Web', color: 'bg-blue-500' },
  wasm: { label: 'WASM', color: 'bg-amber-500' },
  iframe: { label: 'App', color: 'bg-purple-500' },
  federation: { label: 'Cloud', color: 'bg-rose-500' },
};

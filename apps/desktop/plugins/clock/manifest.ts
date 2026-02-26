import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
  id: 'clock',
  name: 'Clock',
  version: '1.0.0',
  type: 'native',
  icon: '🕐',
  description: 'A beautiful native clock widget with alarm notification support',
  category: 'desktop',
  priority: 40,
  access: 'free',
  entry: './src/ClockApp.svelte',
  // Widget is intentionally NOT auto-registered as a floating desktop widget.
  // The clock appears in the system tray (DesktopWidgets.svelte) and can be
  // opened as a calendar popup by clicking the time.
  // To enable as a standalone widget, uncomment the following:
  // widget: 'src/ClockWidget.svelte',
  // widgetWidth: 180,
  // widgetHeight: 80,
  defaultWidth: 400,
  defaultHeight: 300,
  minWidth: 300,
  minHeight: 200,
  singleton: false,
  resizable: true
};

export default manifest;

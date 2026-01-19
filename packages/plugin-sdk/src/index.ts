/**
 * Desktop OS Plugin SDK
 *
 * Provides utilities for building plugins of all types.
 */

export { createClient, desktopOS } from './client';

// Re-export types from shared-types
export type {
  PluginType,
  PluginManifest,
  LoadedPlugin,
  PluginTypeLoader,
} from '@desktop-os/shared-types';

export type {
  Message,
  MessageHandler,
  MessageBusAdapter,
} from '@desktop-os/shared-types';

export type {
  WindowState,
  AppDefinition,
} from '@desktop-os/shared-types';

/**
 * Window Manager Types
 *
 * Extends shared-types with WM-specific definitions.
 * Uses LoadedPlugin for multi-plugin-type support.
 */

import type { Component } from 'svelte';
import type { LoadedPlugin, PluginType } from '$lib/core/types';

/**
 * App definition = A registered plugin that can be opened as a window
 */
export interface AppDefinition {
  id: string;
  title: string;
  icon: string;
  pluginType: PluginType;
  plugin: LoadedPlugin;

  // Category for Start Menu grouping
  category?: 'portfolio' | 'ai' | 'tools' | 'utilities' | 'creative' | 'system';

  // Window defaults
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;

  // Behavior
  singleton?: boolean;
  resizable?: boolean;

  // Legacy support for direct component/iframe registration
  // (allows bypassing the plugin loader for simple cases)
  type?: 'iframe' | 'component';
  url?: string;
  component?: Component;
  props?: Record<string, unknown> | (() => Record<string, unknown>);

  // Lifecycle hooks
  onInit?: () => void | Promise<void>;
  onDestroy?: () => void | Promise<void>;
}

/**
 * Snap zone types for window snapping
 */
export type SnapZone =
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'maximize'
  | null;

/**
 * Window state = A running instance of an app
 */
export interface WindowState {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  isResizing: boolean;
  isSnapped?: boolean;
  snapZone?: SnapZone;
  preMaximize?: { x: number; y: number; width: number; height: number };
  preSnap?: { x: number; y: number; width: number; height: number };

  // State that can be set by component plugins
  isRinging?: boolean;
}

/**
 * Context menu item
 */
export interface MenuItem {
  label: string;
  icon?: string;
  action?: () => void;
  disabled?: boolean;
  separator?: boolean;
  checked?: boolean;
  submenu?: MenuItem[];
  shortcut?: string;
}

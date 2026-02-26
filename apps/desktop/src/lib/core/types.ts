/**
 * Core type definitions
 *
 * Re-exports types from shared-types package and provides local type definitions
 */

import type { Component } from 'svelte';

/**
 * Application categories for intent-driven grouping
 */
export type AppCategory = 'showcase' | 'studio' | 'desktop' | 'admin';

/**
 * Plugin types supported by the Desktop OS
 */
export type PluginType =
  | 'native'        // Svelte 5 component
  | 'webcomponent'  // Custom element
  | 'iframe'        // External URL
  | 'federation'    // Module Federation remote
  | 'wasm';         // WebAssembly module

/**
 * Plugin manifest - each plugin has a manifest.json
 */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  type: PluginType;
  icon: string;
  description?: string;
  access?: 'free' | 'protected';

  // Type-specific configuration
  entry?: string;              // For native/webcomponent/wasm
  url?: string;                // For iframe
  remote?: {                   // For federation
    name: string;
    entry: string;             // remoteEntry.js URL
    exposedModule: string;     // e.g., './Dashboard'
  };
  wasmModule?: string;         // For wasm: path to .wasm file

  // Window defaults
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  singleton?: boolean;
  resizable?: boolean;

  // Widget configuration
  widget?: string;        // Path to desktop widget component (relative to plugin)
  widgetWidth?: number;   // Default widget width
  widgetHeight?: number;  // Default widget height

  // Application category for grouping in Start Menu
  category?: AppCategory;

  // Intent-driven grouping fields
  priority?: number;         // Sort order within category (lower = first, default 50)
  showOnDesktop?: boolean;   // Show as desktop icon
  pinnedToTaskbar?: boolean; // Pin to taskbar by default
  autoOpen?: 'always' | 'first-visit' | false;  // Auto-open behavior
  tags?: string[];           // Search discovery tags

  // Permissions (future)
  permissions?: string[];

  // Dependencies on other plugins
  dependencies?: string[];
}

/**
 * Loaded plugin instance ready for use
 */
export interface LoadedPlugin {
  manifest: PluginManifest;
  type: PluginType;

  // Render configuration varies by type
  render:
    | { kind: 'component'; component: Component; props?: Record<string, unknown> | (() => Record<string, unknown>) }
    | { kind: 'webcomponent'; tagName: string }
    | { kind: 'iframe'; url: string; sandbox?: string }
    | { kind: 'federation'; component: Component }
    | { kind: 'federation-offline'; remoteUrl: string; error: string }
    | { kind: 'wasm'; wrapper: Component };

  // Lifecycle hooks
  onInit?: () => Promise<void>;
  onDestroy?: () => Promise<void>;
}

/**
 * Plugin loader interface - one implementation per plugin type
 */
export interface PluginTypeLoader {
  canLoad(manifest: PluginManifest): boolean;
  load(manifest: PluginManifest, basePath?: string): Promise<LoadedPlugin>;
  unload(plugin: LoadedPlugin): Promise<void>;
}

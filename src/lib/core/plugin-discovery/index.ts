/**
 * Plugin Discovery System Module
 *
 * Provides automatic discovery and validation of plugin manifests.
 *
 * @example
 * ```ts
 * import { pluginScanner, discoverPlugins } from '$lib/core/plugin-discovery';
 *
 * // Option 1: Use the singleton scanner
 * const manifests = import.meta.glob('/plugins/*\/manifest.json');
 * pluginScanner.initialize(manifests);
 * const { plugins } = await pluginScanner.scan();
 *
 * // Option 2: Use the convenience function
 * const { plugins } = await discoverPlugins(
 *   import.meta.glob('/plugins/*\/manifest.json')
 * );
 *
 * // Get plugins by type
 * const nativePlugins = pluginScanner.getPluginsByType('native');
 * const iframePlugins = pluginScanner.getPluginsByType('iframe');
 * ```
 */

// Scanner - Types and singleton instance
export {
  PluginScanner,
  pluginScanner,
  createScanner,
  discoverPlugins,
  type PluginScanResult,
  type PluginDiscoveryResult,
  type GlobImportResult,
} from './scanner';

// Validator - Types and functions
export {
  validateManifest,
  isValidPluginManifest,
  type ValidationResult,
} from './validator';

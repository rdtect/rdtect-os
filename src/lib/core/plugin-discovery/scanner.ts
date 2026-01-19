/**
 * Plugin Discovery Scanner
 *
 * Automatically discovers and loads plugin manifests from the plugins directory.
 * Uses Vite's import.meta.glob for build-time discovery with hot-reloading in development.
 */
import type { PluginManifest } from '$lib/core/types';
import { validateManifest, type ValidationResult } from './validator';

/**
 * Result of scanning a single plugin manifest
 */
export interface PluginScanResult {
  /** Path to the manifest file */
  path: string;
  /** The validated manifest, if valid */
  manifest?: PluginManifest;
  /** Validation result with errors/warnings */
  validation: ValidationResult;
}

/**
 * Result of scanning all plugins
 */
export interface PluginDiscoveryResult {
  /** Successfully discovered plugins */
  plugins: PluginManifest[];
  /** All scan results including failed validations */
  results: PluginScanResult[];
  /** Total manifests scanned */
  scannedCount: number;
  /** Number of valid plugins */
  validCount: number;
  /** Number of invalid plugins */
  invalidCount: number;
}

/**
 * Type for Vite's glob import result
 */
export type GlobImportResult = Record<string, () => Promise<{ default: unknown }>>;

/**
 * Plugin Scanner class for discovering and validating plugin manifests
 */
export class PluginScanner {
  private cachedResults: PluginDiscoveryResult | null = null;
  private manifestGlobs: GlobImportResult | null = null;

  /**
   * Initialize the scanner with glob imports
   * This must be called with the result of import.meta.glob
   *
   * @example
   * ```ts
   * const scanner = new PluginScanner();
   * const manifests = import.meta.glob('/plugins/*\/manifest.json');
   * scanner.initialize(manifests);
   * ```
   */
  initialize(globs: GlobImportResult): void {
    this.manifestGlobs = globs;
    this.cachedResults = null; // Invalidate cache on re-initialization
  }

  /**
   * Scan all plugin directories and load manifests
   *
   * @param forceRefresh - Force re-scanning even if cached results exist
   * @returns Promise resolving to the discovery result
   */
  async scan(forceRefresh = false): Promise<PluginDiscoveryResult> {
    // Return cached results if available and not forcing refresh
    if (this.cachedResults && !forceRefresh) {
      return this.cachedResults;
    }

    if (!this.manifestGlobs) {
      console.warn('[PluginScanner] Scanner not initialized. Call initialize() first.');
      return {
        plugins: [],
        results: [],
        scannedCount: 0,
        validCount: 0,
        invalidCount: 0,
      };
    }

    const results: PluginScanResult[] = [];
    const plugins: PluginManifest[] = [];

    // Process each manifest file
    const paths = Object.keys(this.manifestGlobs);

    for (const path of paths) {
      const result = await this.loadAndValidateManifest(path);
      results.push(result);

      if (result.validation.valid && result.manifest) {
        plugins.push(result.manifest);
      }
    }

    // Sort plugins by name for consistent ordering
    plugins.sort((a, b) => a.name.localeCompare(b.name));

    const discoveryResult: PluginDiscoveryResult = {
      plugins,
      results,
      scannedCount: results.length,
      validCount: plugins.length,
      invalidCount: results.length - plugins.length,
    };

    // Cache the results
    this.cachedResults = discoveryResult;

    // Log summary
    this.logDiscoverySummary(discoveryResult);

    return discoveryResult;
  }

  /**
   * Load and validate a single manifest file
   */
  private async loadAndValidateManifest(path: string): Promise<PluginScanResult> {
    try {
      // Load the manifest using the glob import function
      const loader = this.manifestGlobs![path];
      const module = await loader();
      const rawManifest = module.default;

      // Validate the manifest
      const validation = validateManifest(rawManifest);

      if (validation.valid) {
        return {
          path,
          manifest: rawManifest as PluginManifest,
          validation,
        };
      }

      // Log validation errors
      console.warn(`[PluginScanner] Invalid manifest at ${path}:`);
      validation.errors.forEach((err) => console.warn(`  - ${err}`));
      if (validation.warnings.length > 0) {
        validation.warnings.forEach((warn) => console.info(`  - Warning: ${warn}`));
      }

      return { path, validation };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[PluginScanner] Failed to load manifest at ${path}:`, errorMessage);

      return {
        path,
        validation: {
          valid: false,
          errors: [`Failed to load manifest: ${errorMessage}`],
          warnings: [],
        },
      };
    }
  }

  /**
   * Log a summary of the discovery process
   */
  private logDiscoverySummary(result: PluginDiscoveryResult): void {
    const { scannedCount, validCount, invalidCount } = result;

    if (scannedCount === 0) {
      console.info('[PluginScanner] No plugin manifests found');
      return;
    }

    console.info(
      `[PluginScanner] Discovered ${validCount}/${scannedCount} valid plugins` +
      (invalidCount > 0 ? ` (${invalidCount} invalid)` : '')
    );

    // Log warnings for valid plugins
    result.results
      .filter((r) => r.validation.valid && r.validation.warnings.length > 0)
      .forEach((r) => {
        console.info(`[PluginScanner] Warnings for ${r.manifest?.id}:`);
        r.validation.warnings.forEach((w) => console.info(`  - ${w}`));
      });
  }

  /**
   * Get a specific plugin manifest by ID
   *
   * @param pluginId - The plugin ID to find
   * @returns The plugin manifest or undefined if not found
   */
  getPlugin(pluginId: string): PluginManifest | undefined {
    if (!this.cachedResults) {
      console.warn('[PluginScanner] No cached results. Call scan() first.');
      return undefined;
    }

    return this.cachedResults.plugins.find((p) => p.id === pluginId);
  }

  /**
   * Get all discovered plugins
   *
   * @returns Array of valid plugin manifests
   */
  getPlugins(): PluginManifest[] {
    return this.cachedResults?.plugins ?? [];
  }

  /**
   * Get plugins by type
   *
   * @param type - The plugin type to filter by
   * @returns Array of plugins matching the type
   */
  getPluginsByType(type: PluginManifest['type']): PluginManifest[] {
    return this.getPlugins().filter((p) => p.type === type);
  }

  /**
   * Clear the cached results
   */
  clearCache(): void {
    this.cachedResults = null;
  }

  /**
   * Check if the scanner has been initialized
   */
  isInitialized(): boolean {
    return this.manifestGlobs !== null;
  }

  /**
   * Check if results are cached
   */
  hasCachedResults(): boolean {
    return this.cachedResults !== null;
  }
}

/**
 * Default scanner instance
 *
 * Usage in your app:
 * ```ts
 * import { pluginScanner } from '$lib/core/plugin-discovery';
 *
 * // Initialize with Vite glob imports (typically in +layout.ts or initialization code)
 * const manifests = import.meta.glob('/plugins/*\/manifest.json');
 * pluginScanner.initialize(manifests);
 *
 * // Scan for plugins
 * const { plugins } = await pluginScanner.scan();
 * ```
 */
export const pluginScanner = new PluginScanner();

/**
 * Helper function to create and initialize a scanner in one call
 *
 * @param globs - The result of import.meta.glob for manifest files
 * @returns Initialized PluginScanner instance
 */
export function createScanner(globs: GlobImportResult): PluginScanner {
  const scanner = new PluginScanner();
  scanner.initialize(globs);
  return scanner;
}

/**
 * Discover plugins using the default scanner
 * Convenience function that initializes and scans in one call
 *
 * @param globs - The result of import.meta.glob for manifest files
 * @returns Promise resolving to the discovery result
 */
export async function discoverPlugins(globs: GlobImportResult): Promise<PluginDiscoveryResult> {
  pluginScanner.initialize(globs);
  return pluginScanner.scan();
}

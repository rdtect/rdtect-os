/**
 * Plugin Manifest Validator
 *
 * Validates plugin manifests against the PluginManifest schema
 * and ensures type-specific required fields are present.
 */
import type { PluginManifest, PluginType } from '$lib/core/types';

/**
 * Validation result with detailed error messages
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Valid plugin types
 */
const VALID_PLUGIN_TYPES: PluginType[] = [
  'native',
  'webcomponent',
  'iframe',
  'federation',
  'wasm',
];

/**
 * Validates that a value is a non-empty string
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates that a value is a valid version string (semver-like)
 */
function isValidVersion(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  // Basic semver pattern: major.minor.patch with optional prerelease
  return /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(value);
}

/**
 * Validates that a value is a positive number
 */
function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && Number.isFinite(value);
}

/**
 * Validates that a value is a boolean
 */
function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Validates that a value is a valid plugin type
 */
function isValidPluginType(value: unknown): value is PluginType {
  return typeof value === 'string' && VALID_PLUGIN_TYPES.includes(value as PluginType);
}

/**
 * Validates the remote configuration for federation plugins
 */
function validateRemoteConfig(
  remote: unknown,
  errors: string[],
  warnings: string[]
): void {
  if (typeof remote !== 'object' || remote === null) {
    errors.push('Federation plugin requires a valid "remote" object');
    return;
  }

  const remoteObj = remote as Record<string, unknown>;

  if (!isNonEmptyString(remoteObj.name)) {
    errors.push('Federation remote.name must be a non-empty string');
  }

  if (!isNonEmptyString(remoteObj.entry)) {
    errors.push('Federation remote.entry must be a non-empty string (URL to remoteEntry.js)');
  }

  if (!isNonEmptyString(remoteObj.exposedModule)) {
    errors.push('Federation remote.exposedModule must be a non-empty string');
  }
}

/**
 * Validates type-specific required fields
 */
function validateTypeSpecificFields(
  manifest: Record<string, unknown>,
  errors: string[],
  warnings: string[]
): void {
  const type = manifest.type as PluginType;

  switch (type) {
    case 'native':
    case 'webcomponent':
      if (!isNonEmptyString(manifest.entry)) {
        errors.push(`${type} plugin requires an "entry" field pointing to the component/element`);
      }
      break;

    case 'iframe':
      if (!isNonEmptyString(manifest.url)) {
        errors.push('iframe plugin requires a "url" field');
      }
      break;

    case 'federation':
      validateRemoteConfig(manifest.remote, errors, warnings);
      break;

    case 'wasm':
      if (!isNonEmptyString(manifest.entry)) {
        errors.push('wasm plugin requires an "entry" field pointing to the wrapper component');
      }
      if (!isNonEmptyString(manifest.wasmModule)) {
        warnings.push('wasm plugin should have a "wasmModule" field pointing to the .wasm file');
      }
      break;
  }
}

/**
 * Validates optional window configuration fields
 */
function validateWindowConfig(
  manifest: Record<string, unknown>,
  errors: string[],
  warnings: string[]
): void {
  const numberFields = ['defaultWidth', 'defaultHeight', 'minWidth', 'minHeight'];

  for (const field of numberFields) {
    if (manifest[field] !== undefined && !isPositiveNumber(manifest[field])) {
      errors.push(`"${field}" must be a positive number`);
    }
  }

  // Check minWidth/minHeight don't exceed defaults
  if (
    isPositiveNumber(manifest.minWidth) &&
    isPositiveNumber(manifest.defaultWidth) &&
    manifest.minWidth > manifest.defaultWidth
  ) {
    warnings.push('minWidth should not exceed defaultWidth');
  }

  if (
    isPositiveNumber(manifest.minHeight) &&
    isPositiveNumber(manifest.defaultHeight) &&
    manifest.minHeight > manifest.defaultHeight
  ) {
    warnings.push('minHeight should not exceed defaultHeight');
  }

  // Validate boolean fields
  const booleanFields = ['singleton', 'resizable'];
  for (const field of booleanFields) {
    if (manifest[field] !== undefined && !isBoolean(manifest[field])) {
      errors.push(`"${field}" must be a boolean`);
    }
  }
}

/**
 * Validates optional arrays
 */
function validateArrayFields(
  manifest: Record<string, unknown>,
  errors: string[],
  warnings: string[]
): void {
  // Validate permissions array
  if (manifest.permissions !== undefined) {
    if (!Array.isArray(manifest.permissions)) {
      errors.push('"permissions" must be an array of strings');
    } else if (!manifest.permissions.every((p: unknown) => typeof p === 'string')) {
      errors.push('All items in "permissions" must be strings');
    }
  }

  // Validate dependencies array
  if (manifest.dependencies !== undefined) {
    if (!Array.isArray(manifest.dependencies)) {
      errors.push('"dependencies" must be an array of plugin IDs');
    } else if (!manifest.dependencies.every((d: unknown) => typeof d === 'string')) {
      errors.push('All items in "dependencies" must be strings');
    }
  }
}

/**
 * Validates a plugin manifest against the PluginManifest schema
 *
 * @param manifest - The raw manifest object to validate
 * @returns ValidationResult with valid flag and any errors/warnings
 */
export function validateManifest(manifest: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if manifest is an object
  if (typeof manifest !== 'object' || manifest === null || Array.isArray(manifest)) {
    return {
      valid: false,
      errors: ['Manifest must be a JSON object'],
      warnings: [],
    };
  }

  const m = manifest as Record<string, unknown>;

  // Validate required fields
  if (!isNonEmptyString(m.id)) {
    errors.push('"id" is required and must be a non-empty string');
  } else if (!/^[a-z0-9-]+$/.test(m.id)) {
    errors.push('"id" must contain only lowercase letters, numbers, and hyphens');
  }

  if (!isNonEmptyString(m.name)) {
    errors.push('"name" is required and must be a non-empty string');
  }

  if (!isNonEmptyString(m.version)) {
    errors.push('"version" is required and must be a non-empty string');
  } else if (!isValidVersion(m.version)) {
    warnings.push('"version" should follow semver format (e.g., 1.0.0)');
  }

  if (!isValidPluginType(m.type)) {
    errors.push(`"type" must be one of: ${VALID_PLUGIN_TYPES.join(', ')}`);
  }

  if (!isNonEmptyString(m.icon)) {
    errors.push('"icon" is required and must be a non-empty string (emoji or icon class)');
  }

  // Validate optional description
  if (m.description !== undefined && typeof m.description !== 'string') {
    errors.push('"description" must be a string');
  }

  // Only validate type-specific and optional fields if type is valid
  if (isValidPluginType(m.type)) {
    validateTypeSpecificFields(m, errors, warnings);
  }

  validateWindowConfig(m, errors, warnings);
  validateArrayFields(m, errors, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Type guard to check if a validated manifest is a PluginManifest
 *
 * @param manifest - The manifest to check
 * @returns True if the manifest is valid and can be cast to PluginManifest
 */
export function isValidPluginManifest(manifest: unknown): manifest is PluginManifest {
  return validateManifest(manifest).valid;
}

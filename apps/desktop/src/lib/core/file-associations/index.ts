/**
 * File Associations Module
 *
 * Manages file type associations and default applications.
 */

// Types and singleton instance
export { fileAssociations, type FileAssociations } from './associations.svelte';

// File handler functions
export { initFileHandler, startFileHandler, stopFileHandler } from './file-handler.svelte';

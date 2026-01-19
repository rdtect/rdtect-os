/**
 * File Associations System
 *
 * Manages file type associations similar to Linux's mimeapps.list.
 * Stores associations in /home/user/.config/mimeapps.list
 *
 * Supports:
 * - Default associations for common file types
 * - User-configurable associations
 * - Opening files with the associated application
 */

import { vfs } from '../vfs/vfs.svelte';
import { eventBus } from '../event-bus';
import type { FileAssociation } from '../vfs/types';

// Path to the mimeapps.list file (like Linux)
const MIMEAPPS_PATH = '/home/user/.config/mimeapps.list';

/**
 * Structure of the mimeapps.list file
 */
interface MimeAppsList {
  // Default applications for each extension
  defaultApplications: Record<string, string>;
  // Added associations (additional apps that can open a type)
  addedAssociations: Record<string, string[]>;
  // Removed associations (apps that shouldn't appear for a type)
  removedAssociations: Record<string, string[]>;
}

/**
 * Default file associations
 */
const DEFAULT_ASSOCIATIONS: Record<string, FileAssociation> = {
  '.md': {
    extension: '.md',
    mimeType: 'text/markdown',
    appId: 'markdown-editor',
    icon: '📝',
    name: 'Markdown Document'
  },
  '.excalidraw': {
    extension: '.excalidraw',
    mimeType: 'application/vnd.excalidraw+json',
    appId: 'excalidraw',
    icon: '🎨',
    name: 'Excalidraw Drawing'
  },
  '.txt': {
    extension: '.txt',
    mimeType: 'text/plain',
    appId: 'notepad',
    icon: '📄',
    name: 'Text Document'
  },
  '.json': {
    extension: '.json',
    mimeType: 'application/json',
    appId: 'json-viewer',
    icon: '📋',
    name: 'JSON File'
  },
  '.png': {
    extension: '.png',
    mimeType: 'image/png',
    appId: 'image-viewer',
    icon: '🖼️',
    name: 'PNG Image'
  },
  '.jpg': {
    extension: '.jpg',
    mimeType: 'image/jpeg',
    appId: 'image-viewer',
    icon: '🖼️',
    name: 'JPEG Image'
  },
  '.jpeg': {
    extension: '.jpeg',
    mimeType: 'image/jpeg',
    appId: 'image-viewer',
    icon: '🖼️',
    name: 'JPEG Image'
  },
  '.gif': {
    extension: '.gif',
    mimeType: 'image/gif',
    appId: 'image-viewer',
    icon: '🖼️',
    name: 'GIF Image'
  },
  '.webp': {
    extension: '.webp',
    mimeType: 'image/webp',
    appId: 'image-viewer',
    icon: '🖼️',
    name: 'WebP Image'
  },
  '.svg': {
    extension: '.svg',
    mimeType: 'image/svg+xml',
    appId: 'image-viewer',
    icon: '🖼️',
    name: 'SVG Image'
  },
  '.pdf': {
    extension: '.pdf',
    mimeType: 'application/pdf',
    appId: 'pdf-viewer',
    icon: '📕',
    name: 'PDF Document'
  },
  '.html': {
    extension: '.html',
    mimeType: 'text/html',
    appId: 'browser',
    icon: '🌐',
    name: 'HTML Document'
  },
  '.htm': {
    extension: '.htm',
    mimeType: 'text/html',
    appId: 'browser',
    icon: '🌐',
    name: 'HTML Document'
  },
  '.css': {
    extension: '.css',
    mimeType: 'text/css',
    appId: 'notepad',
    icon: '🎨',
    name: 'CSS Stylesheet'
  },
  '.js': {
    extension: '.js',
    mimeType: 'application/javascript',
    appId: 'notepad',
    icon: '📜',
    name: 'JavaScript File'
  },
  '.ts': {
    extension: '.ts',
    mimeType: 'application/typescript',
    appId: 'notepad',
    icon: '📜',
    name: 'TypeScript File'
  },
  '.yaml': {
    extension: '.yaml',
    mimeType: 'application/x-yaml',
    appId: 'notepad',
    icon: '📋',
    name: 'YAML File'
  },
  '.yml': {
    extension: '.yml',
    mimeType: 'application/x-yaml',
    appId: 'notepad',
    icon: '📋',
    name: 'YAML File'
  },
  '.xml': {
    extension: '.xml',
    mimeType: 'application/xml',
    appId: 'notepad',
    icon: '📋',
    name: 'XML File'
  },
  '.csv': {
    extension: '.csv',
    mimeType: 'text/csv',
    appId: 'notepad',
    icon: '📊',
    name: 'CSV File'
  }
};

/**
 * File Associations Interface
 */
export interface FileAssociations {
  /**
   * Get the app ID that should handle a file
   * @param path - File path (uses extension to determine type)
   */
  getAppForFile(path: string): string | undefined;

  /**
   * Get the full association info for a file
   * @param path - File path
   */
  getAssociationForFile(path: string): FileAssociation | undefined;

  /**
   * Set the default app for an extension
   * @param extension - File extension (with dot, e.g., '.md')
   * @param appId - Application ID
   */
  setDefaultApp(extension: string, appId: string): Promise<void>;

  /**
   * Open a file with its associated application
   * @param path - File path to open
   */
  openFile(path: string): Promise<void>;

  /**
   * Get all apps that can open a file type
   * @param extension - File extension
   */
  getAppsForExtension(extension: string): string[];

  /**
   * Add an association for an extension
   * @param extension - File extension
   * @param appId - Application ID
   */
  addAssociation(extension: string, appId: string): Promise<void>;

  /**
   * Remove an association for an extension
   * @param extension - File extension
   * @param appId - Application ID
   */
  removeAssociation(extension: string, appId: string): Promise<void>;

  /**
   * Get all registered associations
   */
  getAllAssociations(): Record<string, FileAssociation>;

  /**
   * Register a new file type association
   * @param association - File association to register
   */
  registerAssociation(association: FileAssociation): void;
}

/**
 * File Associations implementation
 */
class FileAssociationsImpl implements FileAssociations {
  private customAssociations: Map<string, FileAssociation> = new Map();
  private mimeAppsList: MimeAppsList | null = null;
  private initialized = false;

  constructor() {
    // Initialize with default associations
    Object.entries(DEFAULT_ASSOCIATIONS).forEach(([ext, assoc]) => {
      this.customAssociations.set(ext.toLowerCase(), assoc);
    });
  }

  /**
   * Initialize the file associations system
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load user's mimeapps.list if it exists
      const exists = await vfs.exists(MIMEAPPS_PATH);
      if (exists) {
        this.mimeAppsList = await vfs.readJsonFile<MimeAppsList>(MIMEAPPS_PATH);
      } else {
        // Create default mimeapps.list
        this.mimeAppsList = {
          defaultApplications: {},
          addedAssociations: {},
          removedAssociations: {}
        };
        await this.saveMimeAppsList();
      }
    } catch (error) {
      console.warn('[FileAssociations] Failed to load mimeapps.list:', error);
      this.mimeAppsList = {
        defaultApplications: {},
        addedAssociations: {},
        removedAssociations: {}
      };
    }

    this.initialized = true;
  }

  /**
   * Ensure initialization
   */
  private async ensureInit(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  /**
   * Save mimeapps.list to VFS
   */
  private async saveMimeAppsList(): Promise<void> {
    if (!this.mimeAppsList) return;

    try {
      // Ensure parent directory exists
      const parentDir = MIMEAPPS_PATH.substring(0, MIMEAPPS_PATH.lastIndexOf('/'));
      const parentExists = await vfs.exists(parentDir);
      if (!parentExists) {
        await vfs.mkdir(parentDir, true);
      }

      await vfs.writeFile(MIMEAPPS_PATH, JSON.stringify(this.mimeAppsList, null, 2));
    } catch (error) {
      console.error('[FileAssociations] Failed to save mimeapps.list:', error);
    }
  }

  /**
   * Get the file extension from a path
   */
  private getExtension(path: string): string {
    const filename = path.split('/').pop() || '';
    const dotIndex = filename.lastIndexOf('.');
    if (dotIndex === -1 || dotIndex === 0) {
      return '';
    }
    return filename.substring(dotIndex).toLowerCase();
  }

  getAppForFile(path: string): string | undefined {
    const extension = this.getExtension(path);
    if (!extension) return undefined;

    // Check user's custom default first
    if (this.mimeAppsList?.defaultApplications[extension]) {
      return this.mimeAppsList.defaultApplications[extension];
    }

    // Fall back to default associations
    const association = this.customAssociations.get(extension);
    return association?.appId;
  }

  getAssociationForFile(path: string): FileAssociation | undefined {
    const extension = this.getExtension(path);
    if (!extension) return undefined;

    const association = this.customAssociations.get(extension);
    if (!association) return undefined;

    // If user has a custom default app, use that
    if (this.mimeAppsList?.defaultApplications[extension]) {
      return {
        ...association,
        appId: this.mimeAppsList.defaultApplications[extension]
      };
    }

    return association;
  }

  async setDefaultApp(extension: string, appId: string): Promise<void> {
    await this.ensureInit();

    const ext = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;

    if (!this.mimeAppsList) {
      this.mimeAppsList = {
        defaultApplications: {},
        addedAssociations: {},
        removedAssociations: {}
      };
    }

    this.mimeAppsList.defaultApplications[ext] = appId;
    await this.saveMimeAppsList();
  }

  async openFile(path: string): Promise<void> {
    const appId = this.getAppForFile(path);

    // Emit the file:open event
    // The handler in the main page will open the window and pass the file
    eventBus.emit('file:open', { path, appId });
  }

  getAppsForExtension(extension: string): string[] {
    const ext = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
    const apps: string[] = [];

    // Get default app
    const defaultApp = this.mimeAppsList?.defaultApplications[ext];
    if (defaultApp) {
      apps.push(defaultApp);
    }

    // Get from base association
    const association = this.customAssociations.get(ext);
    if (association && !apps.includes(association.appId)) {
      apps.push(association.appId);
    }

    // Get added associations
    const addedApps = this.mimeAppsList?.addedAssociations[ext] || [];
    addedApps.forEach(appId => {
      if (!apps.includes(appId)) {
        apps.push(appId);
      }
    });

    // Remove any that are in the removed list
    const removedApps = this.mimeAppsList?.removedAssociations[ext] || [];
    return apps.filter(appId => !removedApps.includes(appId));
  }

  async addAssociation(extension: string, appId: string): Promise<void> {
    await this.ensureInit();

    const ext = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;

    if (!this.mimeAppsList) {
      this.mimeAppsList = {
        defaultApplications: {},
        addedAssociations: {},
        removedAssociations: {}
      };
    }

    if (!this.mimeAppsList.addedAssociations[ext]) {
      this.mimeAppsList.addedAssociations[ext] = [];
    }

    if (!this.mimeAppsList.addedAssociations[ext].includes(appId)) {
      this.mimeAppsList.addedAssociations[ext].push(appId);
    }

    // Remove from removed associations if present
    if (this.mimeAppsList.removedAssociations[ext]) {
      const idx = this.mimeAppsList.removedAssociations[ext].indexOf(appId);
      if (idx !== -1) {
        this.mimeAppsList.removedAssociations[ext].splice(idx, 1);
      }
    }

    await this.saveMimeAppsList();
  }

  async removeAssociation(extension: string, appId: string): Promise<void> {
    await this.ensureInit();

    const ext = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;

    if (!this.mimeAppsList) {
      this.mimeAppsList = {
        defaultApplications: {},
        addedAssociations: {},
        removedAssociations: {}
      };
    }

    if (!this.mimeAppsList.removedAssociations[ext]) {
      this.mimeAppsList.removedAssociations[ext] = [];
    }

    if (!this.mimeAppsList.removedAssociations[ext].includes(appId)) {
      this.mimeAppsList.removedAssociations[ext].push(appId);
    }

    await this.saveMimeAppsList();
  }

  getAllAssociations(): Record<string, FileAssociation> {
    const result: Record<string, FileAssociation> = {};

    this.customAssociations.forEach((assoc, ext) => {
      result[ext] = { ...assoc };

      // Override with user's custom default if present
      if (this.mimeAppsList?.defaultApplications[ext]) {
        result[ext].appId = this.mimeAppsList.defaultApplications[ext];
      }
    });

    return result;
  }

  registerAssociation(association: FileAssociation): void {
    const ext = association.extension.toLowerCase();
    this.customAssociations.set(ext, association);

    // Also register with VFS
    vfs.registerAssociation(association);
  }
}

// Singleton export
export const fileAssociations = new FileAssociationsImpl();

// Initialize on import
if (typeof window !== 'undefined') {
  fileAssociations.init().catch(console.error);
}

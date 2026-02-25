/**
 * Virtual File System Types
 *
 * Unix-like file system for the web desktop.
 * Everything is a file - documents, settings, app state, even running processes.
 */

export type FileType =
  | 'file'       // Regular file
  | 'directory'  // Directory
  | 'symlink'    // Symbolic link
  | 'app'        // Application (executable)
  | 'device'     // Virtual device (/dev/*)
  | 'proc';      // Process info (/proc/*)

export interface FileStat {
  name: string;
  path: string;
  type: FileType;
  size: number;
  mimeType?: string;

  // Unix-like metadata
  mode: number;           // Permissions (e.g., 0o755)
  uid: string;            // Owner (user or agent ID)
  gid: string;            // Group

  // Timestamps
  createdAt: Date;
  modifiedAt: Date;
  accessedAt: Date;

  // Extended attributes
  xattr?: Record<string, string>;
}

export interface FileEntry extends FileStat {
  content?: ArrayBuffer | string | object;
  children?: string[];    // For directories: child paths
  target?: string;        // For symlinks: target path
}

export interface FileHandle {
  path: string;
  mode: 'r' | 'w' | 'rw' | 'a';
  position: number;

  read(size?: number): Promise<ArrayBuffer>;
  write(data: ArrayBuffer | string): Promise<number>;
  seek(position: number): void;
  close(): Promise<void>;
}

// File system events (for watchers)
export type FSEventType = 'create' | 'modify' | 'delete' | 'rename' | 'chmod';

export interface FSEvent {
  type: FSEventType;
  path: string;
  oldPath?: string;       // For rename
  stat?: FileStat;
  timestamp: Date;
  actor?: string;         // User or agent that caused the change
}

export type FSWatcher = (event: FSEvent) => void;

// File associations
export interface FileAssociation {
  extension: string;      // e.g., '.md'
  mimeType: string;       // e.g., 'text/markdown'
  appId: string;          // e.g., 'markdown-editor'
  icon: string;           // e.g., '📝'
  name: string;           // e.g., 'Markdown Document'
}

// VFS interface (Unix-like)
export interface VirtualFileSystem {
  // Navigation
  pwd(): string;
  cd(path: string): Promise<void>;

  // File operations
  stat(path: string): Promise<FileStat>;
  exists(path: string): Promise<boolean>;

  // Read/Write
  readFile(path: string): Promise<ArrayBuffer>;
  readTextFile(path: string): Promise<string>;
  readJsonFile<T = unknown>(path: string): Promise<T>;
  writeFile(path: string, content: ArrayBuffer | string | object): Promise<void>;
  appendFile(path: string, content: ArrayBuffer | string): Promise<void>;

  // Directory operations
  mkdir(path: string, recursive?: boolean): Promise<void>;
  readdir(path: string): Promise<FileStat[]>;
  rmdir(path: string, recursive?: boolean): Promise<void>;

  // File management
  rm(path: string): Promise<void>;
  cp(src: string, dest: string): Promise<void>;
  mv(src: string, dest: string): Promise<void>;
  ln(target: string, link: string, symbolic?: boolean): Promise<void>;

  // Permissions
  chmod(path: string, mode: number): Promise<void>;
  chown(path: string, uid: string, gid?: string): Promise<void>;

  // Watching
  watch(path: string, callback: FSWatcher): () => void;

  // Search
  find(path: string, pattern: string | RegExp): Promise<string[]>;
  grep(path: string, pattern: string | RegExp): Promise<{ path: string; line: number; content: string }[]>;

  // File associations
  getAssociation(path: string): FileAssociation | undefined;
  registerAssociation(association: FileAssociation): void;

  // Sync with backend
  sync(): Promise<void>;
}

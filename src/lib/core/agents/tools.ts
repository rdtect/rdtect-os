/**
 * Agent Tools
 *
 * Tools that agents can use to interact with the desktop OS.
 * Each tool is a function that an LLM can call.
 */

import type { AgentTool, Agent } from './types';
import { vfs } from '../vfs';
import { wm } from '$lib/shell';
import { eventBus } from '../event-bus';

// === File System Tools ===

export const readFileTool: AgentTool = {
  name: 'read_file',
  description: 'Read the contents of a file from the virtual file system',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The absolute path to the file (e.g., /home/user/Documents/notes.md)'
      }
    },
    required: ['path']
  },
  execute: async (params) => {
    const { path } = params as { path: string };
    const content = await vfs.readTextFile(path);
    return { content, path };
  }
};

export const writeFileTool: AgentTool = {
  name: 'write_file',
  description: 'Write content to a file in the virtual file system',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The absolute path where the file should be written'
      },
      content: {
        type: 'string',
        description: 'The content to write to the file'
      }
    },
    required: ['path', 'content']
  },
  execute: async (params) => {
    const { path, content } = params as { path: string; content: string };
    await vfs.writeFile(path, content);
    return { success: true, path };
  }
};

export const listDirectoryTool: AgentTool = {
  name: 'list_directory',
  description: 'List files and directories in a given path',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The directory path to list (e.g., /home/user/Documents)'
      }
    },
    required: ['path']
  },
  execute: async (params) => {
    const { path } = params as { path: string };
    const entries = await vfs.readdir(path);
    return {
      path,
      entries: entries.map(e => ({
        name: e.name,
        type: e.type,
        size: e.size,
        modifiedAt: e.modifiedAt
      }))
    };
  }
};

export const createDirectoryTool: AgentTool = {
  name: 'create_directory',
  description: 'Create a new directory',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The path of the directory to create'
      },
      recursive: {
        type: 'boolean',
        description: 'Create parent directories if they don\'t exist'
      }
    },
    required: ['path']
  },
  execute: async (params) => {
    const { path, recursive = false } = params as { path: string; recursive?: boolean };
    await vfs.mkdir(path, recursive);
    return { success: true, path };
  }
};

export const deleteFileTool: AgentTool = {
  name: 'delete_file',
  description: 'Delete a file from the virtual file system',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The path of the file to delete'
      }
    },
    required: ['path']
  },
  execute: async (params) => {
    const { path } = params as { path: string };
    await vfs.rm(path);
    return { success: true, path };
  }
};

export const findFilesTool: AgentTool = {
  name: 'find_files',
  description: 'Search for files matching a pattern',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The directory to search in'
      },
      pattern: {
        type: 'string',
        description: 'Regular expression pattern to match file names'
      }
    },
    required: ['path', 'pattern']
  },
  execute: async (params) => {
    const { path, pattern } = params as { path: string; pattern: string };
    const matches = await vfs.find(path, pattern);
    return { path, pattern, matches };
  }
};

export const searchInFilesTool: AgentTool = {
  name: 'search_in_files',
  description: 'Search for content within files (like grep)',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The directory to search in'
      },
      pattern: {
        type: 'string',
        description: 'Regular expression pattern to search for in file contents'
      }
    },
    required: ['path', 'pattern']
  },
  execute: async (params) => {
    const { path, pattern } = params as { path: string; pattern: string };
    const matches = await vfs.grep(path, pattern);
    return { path, pattern, matches };
  }
};

// === Window Manager Tools ===

export const openAppTool: AgentTool = {
  name: 'open_app',
  description: 'Open an application window',
  parameters: {
    type: 'object',
    properties: {
      appId: {
        type: 'string',
        description: 'The ID of the app to open (e.g., "excalidraw", "markdown-editor", "calculator")'
      }
    },
    required: ['appId']
  },
  execute: async (params) => {
    const { appId } = params as { appId: string };
    const windowId = wm.openWindow(appId);
    if (!windowId) {
      throw new Error(`App "${appId}" not found`);
    }
    return { success: true, appId, windowId };
  }
};

export const closeAppTool: AgentTool = {
  name: 'close_app',
  description: 'Close an application window',
  parameters: {
    type: 'object',
    properties: {
      windowId: {
        type: 'string',
        description: 'The ID of the window to close'
      }
    },
    required: ['windowId']
  },
  execute: async (params) => {
    const { windowId } = params as { windowId: string };
    wm.closeWindow(windowId);
    return { success: true, windowId };
  }
};

export const listAppsTool: AgentTool = {
  name: 'list_apps',
  description: 'List all available applications',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async () => {
    const apps = wm.apps.map(app => ({
      id: app.id,
      title: app.title,
      icon: app.icon
    }));
    return { apps };
  }
};

export const listWindowsTool: AgentTool = {
  name: 'list_windows',
  description: 'List all open windows',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async () => {
    const windows = wm.windows.map(win => ({
      id: win.id,
      appId: win.appId,
      title: win.title,
      isMinimized: win.isMinimized,
      isFocused: win.isFocused
    }));
    return { windows };
  }
};

export const focusWindowTool: AgentTool = {
  name: 'focus_window',
  description: 'Focus a specific window',
  parameters: {
    type: 'object',
    properties: {
      windowId: {
        type: 'string',
        description: 'The ID of the window to focus'
      }
    },
    required: ['windowId']
  },
  execute: async (params) => {
    const { windowId } = params as { windowId: string };
    wm.focusWindow(windowId);
    return { success: true, windowId };
  }
};

// === Event/Message Tools ===

export const emitEventTool: AgentTool = {
  name: 'emit_event',
  description: 'Emit an event to the event bus (for inter-app communication)',
  parameters: {
    type: 'object',
    properties: {
      event: {
        type: 'string',
        description: 'The event name (e.g., "file:open", "app:message")'
      },
      data: {
        type: 'object',
        description: 'The event data payload'
      }
    },
    required: ['event']
  },
  execute: async (params) => {
    const { event, data } = params as { event: string; data?: Record<string, unknown> };
    eventBus.emit(event as any, data);
    return { success: true, event, data };
  }
};

export const sendToAppTool: AgentTool = {
  name: 'send_to_app',
  description: 'Send a message to a specific app window',
  parameters: {
    type: 'object',
    properties: {
      windowId: {
        type: 'string',
        description: 'The target window ID'
      },
      action: {
        type: 'string',
        description: 'The action for the app to perform'
      },
      data: {
        type: 'object',
        description: 'Data to send with the action'
      }
    },
    required: ['windowId', 'action']
  },
  execute: async (params) => {
    const { windowId, action, data } = params as {
      windowId: string;
      action: string;
      data?: Record<string, unknown>;
    };

    eventBus.emit('app:message', { windowId, action, data });
    return { success: true, windowId, action };
  }
};

// === System Tools ===

export const getCurrentTimeTool: AgentTool = {
  name: 'get_current_time',
  description: 'Get the current date and time',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async () => {
    const now = new Date();
    return {
      iso: now.toISOString(),
      unix: Math.floor(now.getTime() / 1000),
      formatted: now.toLocaleString()
    };
  }
};

export const waitTool: AgentTool = {
  name: 'wait',
  description: 'Wait for a specified duration',
  parameters: {
    type: 'object',
    properties: {
      seconds: {
        type: 'number',
        description: 'Number of seconds to wait (max 60)'
      }
    },
    required: ['seconds']
  },
  execute: async (params) => {
    const { seconds } = params as { seconds: number };
    const waitTime = Math.min(seconds, 60) * 1000;
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return { waited: seconds };
  }
};

// === All default tools ===

export const DEFAULT_TOOLS: AgentTool[] = [
  // File system
  readFileTool,
  writeFileTool,
  listDirectoryTool,
  createDirectoryTool,
  deleteFileTool,
  findFilesTool,
  searchInFilesTool,

  // Window manager
  openAppTool,
  closeAppTool,
  listAppsTool,
  listWindowsTool,
  focusWindowTool,

  // Events/Messages
  emitEventTool,
  sendToAppTool,

  // System
  getCurrentTimeTool,
  waitTool,
];

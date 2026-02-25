/**
 * Agent System Types
 *
 * Multi-agent system for rdtect OS.
 * Agents are like users - they can run processes (apps), read/write files,
 * and communicate with other agents and the user.
 */

export type AgentStatus = 'idle' | 'thinking' | 'acting' | 'waiting' | 'error';

export type AgentModel = 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku' | 'gpt-4' | 'gpt-4o' | 'local';

export interface AgentCapability {
  name: string;
  description: string;
  // Which tools this capability grants
  tools: string[];
}

// Predefined capabilities
export const CAPABILITIES = {
  FILE_READ: {
    name: 'file:read',
    description: 'Read files from the virtual file system',
    tools: ['vfs.readFile', 'vfs.readdir', 'vfs.stat', 'vfs.find', 'vfs.grep']
  },
  FILE_WRITE: {
    name: 'file:write',
    description: 'Write files to the virtual file system',
    tools: ['vfs.writeFile', 'vfs.mkdir', 'vfs.rm', 'vfs.mv', 'vfs.cp']
  },
  APP_OPEN: {
    name: 'app:open',
    description: 'Open applications',
    tools: ['wm.openWindow', 'wm.closeWindow', 'wm.focusWindow']
  },
  APP_CONTROL: {
    name: 'app:control',
    description: 'Control running applications',
    tools: ['wm.minimizeWindow', 'wm.maximizeWindow', 'wm.moveWindow', 'wm.resizeWindow']
  },
  MESSAGE: {
    name: 'message',
    description: 'Send messages to apps and other agents',
    tools: ['bus.emit', 'bus.send']
  },
  NETWORK: {
    name: 'network',
    description: 'Make HTTP requests',
    tools: ['http.get', 'http.post', 'http.put', 'http.delete']
  },
  SYSTEM: {
    name: 'system',
    description: 'Access system information',
    tools: ['system.info', 'system.time', 'system.env']
  }
} as const;

export interface Agent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  model: AgentModel;
  status: AgentStatus;

  // Permissions
  capabilities: string[];  // Capability names

  // System prompt / personality
  systemPrompt?: string;

  // Current context
  context?: {
    currentDirectory: string;
    openWindows: string[];
    lastAction?: AgentAction;
    memory: AgentMemory[];
  };

  // Timestamps
  createdAt: Date;
  lastActiveAt: Date;
}

export interface AgentMemory {
  type: 'observation' | 'action' | 'thought' | 'result';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Agent actions (tools)
export type AgentActionType =
  | 'open_app'
  | 'close_app'
  | 'focus_app'
  | 'read_file'
  | 'write_file'
  | 'list_directory'
  | 'create_directory'
  | 'delete_file'
  | 'move_file'
  | 'copy_file'
  | 'send_message'
  | 'emit_event'
  | 'wait'
  | 'think'
  | 'ask_user'
  | 'http_request';

export interface AgentAction {
  id: string;
  type: AgentActionType;
  params: Record<string, unknown>;
  timestamp: Date;
}

export interface AgentActionResult {
  actionId: string;
  success: boolean;
  result?: unknown;
  error?: string;
  timestamp: Date;
}

// Agent-to-agent messages
export interface AgentMessage {
  id: string;
  from: string;      // Agent ID
  to: string;        // Agent ID or 'user' or 'broadcast'
  content: string;
  type: 'text' | 'request' | 'response' | 'notification';
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

// Tool definitions for LLM function calling
export interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
  // Actual function to execute
  execute: (params: Record<string, unknown>, agent: Agent) => Promise<unknown>;
}

// Agent events
export type AgentEventType =
  | 'agent:created'
  | 'agent:started'
  | 'agent:stopped'
  | 'agent:action'
  | 'agent:result'
  | 'agent:message'
  | 'agent:error'
  | 'agent:status';

export interface AgentEvent {
  type: AgentEventType;
  agentId: string;
  data: unknown;
  timestamp: Date;
}

// Agent runtime interface
export interface AgentRuntime {
  // Agent management
  createAgent(config: Partial<Agent>): Promise<Agent>;
  getAgent(id: string): Agent | undefined;
  listAgents(): Agent[];
  deleteAgent(id: string): Promise<void>;

  // Execution
  execute(agentId: string, action: Omit<AgentAction, 'id' | 'timestamp'>): Promise<AgentActionResult>;

  // Autonomous mode
  start(agentId: string, goal?: string): Promise<void>;
  stop(agentId: string): Promise<void>;

  // Communication
  sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): Promise<void>;

  // Tool registration
  registerTool(tool: AgentTool): void;
  unregisterTool(name: string): void;

  // Events
  on(event: AgentEventType, callback: (event: AgentEvent) => void): () => void;
}

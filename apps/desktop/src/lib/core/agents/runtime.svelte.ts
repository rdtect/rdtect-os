/**
 * Agent Runtime
 *
 * Manages the lifecycle and execution of AI agents.
 * Agents can autonomously use tools to interact with the desktop OS.
 */

import { browser } from '$app/environment';
import type {
  Agent,
  AgentStatus,
  AgentModel,
  AgentAction,
  AgentActionResult,
  AgentMessage,
  AgentTool,
  AgentEvent,
  AgentEventType,
  AgentRuntime,
  AgentMemory
} from './types';
import { DEFAULT_TOOLS } from './tools';
import { CAPABILITIES } from './types';

type EventCallback = (event: AgentEvent) => void;

class AgentRuntimeImpl implements AgentRuntime {
  // Reactive state
  agents = $state<Agent[]>([]);
  messages = $state<AgentMessage[]>([]);

  private tools: Map<string, AgentTool> = new Map();
  private eventListeners: Map<AgentEventType, Set<EventCallback>> = new Map();
  private runningAgents: Set<string> = new Set();

  constructor() {
    // Register default tools
    DEFAULT_TOOLS.forEach(tool => this.registerTool(tool));
  }

  // === Agent Management ===

  async createAgent(config: Partial<Agent>): Promise<Agent> {
    const id = config.id || `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const agent: Agent = {
      id,
      name: config.name || 'Assistant',
      description: config.description,
      avatar: config.avatar || '🤖',
      model: config.model || 'claude-3-sonnet',
      status: 'idle',
      capabilities: config.capabilities || [
        CAPABILITIES.FILE_READ.name,
        CAPABILITIES.APP_OPEN.name,
        CAPABILITIES.MESSAGE.name,
        CAPABILITIES.SYSTEM.name
      ],
      systemPrompt: config.systemPrompt,
      context: {
        currentDirectory: '/home/user',
        openWindows: [],
        memory: []
      },
      createdAt: now,
      lastActiveAt: now
    };

    this.agents.push(agent);
    this.emit('agent:created', agent.id, agent);

    return agent;
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.find(a => a.id === id);
  }

  listAgents(): Agent[] {
    return [...this.agents];
  }

  async deleteAgent(id: string): Promise<void> {
    // Stop if running
    if (this.runningAgents.has(id)) {
      await this.stop(id);
    }

    const index = this.agents.findIndex(a => a.id === id);
    if (index !== -1) {
      this.agents.splice(index, 1);
    }
  }

  private updateAgentStatus(agentId: string, status: AgentStatus): void {
    const agent = this.getAgent(agentId);
    if (agent) {
      agent.status = status;
      agent.lastActiveAt = new Date();
      this.emit('agent:status', agentId, { status });
    }
  }

  private addMemory(agentId: string, memory: Omit<AgentMemory, 'timestamp'>): void {
    const agent = this.getAgent(agentId);
    if (agent?.context) {
      agent.context.memory.push({
        ...memory,
        timestamp: new Date()
      });

      // Keep memory bounded (last 100 entries)
      if (agent.context.memory.length > 100) {
        agent.context.memory = agent.context.memory.slice(-100);
      }
    }
  }

  // === Tool Management ===

  registerTool(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  unregisterTool(name: string): void {
    this.tools.delete(name);
  }

  getTool(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  getToolsForAgent(agent: Agent): AgentTool[] {
    // Filter tools based on agent capabilities
    const allowedTools = new Set<string>();

    for (const capName of agent.capabilities) {
      const capability = Object.values(CAPABILITIES).find(c => c.name === capName);
      if (capability) {
        capability.tools.forEach(t => allowedTools.add(t));
      }
    }

    // Map tool names to actual tools
    const tools: AgentTool[] = [];
    for (const [name, tool] of this.tools) {
      // Simple matching: tool name should be in allowed tools
      // In practice, you'd have a mapping from capability tools to registered tools
      tools.push(tool);
    }

    return tools;
  }

  // === Execution ===

  async execute(
    agentId: string,
    action: Omit<AgentAction, 'id' | 'timestamp'>
  ): Promise<AgentActionResult> {
    const agent = this.getAgent(agentId);
    if (!agent) {
      return {
        actionId: '',
        success: false,
        error: `Agent ${agentId} not found`,
        timestamp: new Date()
      };
    }

    const actionId = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullAction: AgentAction = {
      ...action,
      id: actionId,
      timestamp: new Date()
    };

    this.updateAgentStatus(agentId, 'acting');
    this.emit('agent:action', agentId, fullAction);
    this.addMemory(agentId, { type: 'action', content: JSON.stringify(fullAction) });

    try {
      const result = await this.executeAction(agent, fullAction);

      const actionResult: AgentActionResult = {
        actionId,
        success: true,
        result,
        timestamp: new Date()
      };

      this.emit('agent:result', agentId, actionResult);
      this.addMemory(agentId, { type: 'result', content: JSON.stringify(result) });
      this.updateAgentStatus(agentId, 'idle');

      return actionResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      const actionResult: AgentActionResult = {
        actionId,
        success: false,
        error: errorMessage,
        timestamp: new Date()
      };

      this.emit('agent:error', agentId, { action: fullAction, error: errorMessage });
      this.addMemory(agentId, { type: 'result', content: `Error: ${errorMessage}` });
      this.updateAgentStatus(agentId, 'error');

      return actionResult;
    }
  }

  private async executeAction(agent: Agent, action: AgentAction): Promise<unknown> {
    // Map action type to tool name
    const toolName = action.type;
    const tool = this.tools.get(toolName);

    if (!tool) {
      throw new Error(`Unknown action type: ${action.type}`);
    }

    // Execute the tool
    return await tool.execute(action.params, agent);
  }

  // === Autonomous Mode ===

  async start(agentId: string, goal?: string): Promise<void> {
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (this.runningAgents.has(agentId)) {
      return; // Already running
    }

    this.runningAgents.add(agentId);
    this.updateAgentStatus(agentId, 'thinking');
    this.emit('agent:started', agentId, { goal });

    if (goal) {
      this.addMemory(agentId, { type: 'thought', content: `Goal: ${goal}` });
    }

    // Start the autonomous loop
    this.runAutonomousLoop(agentId, goal);
  }

  async stop(agentId: string): Promise<void> {
    this.runningAgents.delete(agentId);
    this.updateAgentStatus(agentId, 'idle');
    this.emit('agent:stopped', agentId, {});
  }

  private async runAutonomousLoop(agentId: string, goal?: string): Promise<void> {
    // This is a simplified loop - in practice, you'd call an LLM API
    // to decide what action to take based on the goal and current state

    while (this.runningAgents.has(agentId)) {
      const agent = this.getAgent(agentId);
      if (!agent) break;

      this.updateAgentStatus(agentId, 'thinking');

      // TODO: Call LLM API to decide next action
      // For now, just wait and stop
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if still running
      if (!this.runningAgents.has(agentId)) break;

      // Placeholder: would call LLM here to get next action
      // const nextAction = await this.planNextAction(agent, goal);

      this.updateAgentStatus(agentId, 'waiting');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // === Communication ===

  async sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): Promise<void> {
    const fullMessage: AgentMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.messages.push(fullMessage);
    this.emit('agent:message', message.from, fullMessage);

    // Keep messages bounded
    if (this.messages.length > 1000) {
      this.messages = this.messages.slice(-1000);
    }
  }

  // === Events ===

  on(event: AgentEventType, callback: EventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(callback);

    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  private emit(type: AgentEventType, agentId: string, data: unknown): void {
    const event: AgentEvent = {
      type,
      agentId,
      data,
      timestamp: new Date()
    };

    this.eventListeners.get(type)?.forEach(cb => cb(event));
  }
}

// Singleton instance
export const agentRuntime = new AgentRuntimeImpl();

// Initialize default agent if in browser
if (browser) {
  // Create a default assistant agent
  agentRuntime.createAgent({
    id: 'assistant',
    name: 'Assistant',
    description: 'Your helpful AI assistant',
    avatar: '🤖',
    model: 'claude-3-sonnet',
    capabilities: [
      CAPABILITIES.FILE_READ.name,
      CAPABILITIES.FILE_WRITE.name,
      CAPABILITIES.APP_OPEN.name,
      CAPABILITIES.APP_CONTROL.name,
      CAPABILITIES.MESSAGE.name,
      CAPABILITIES.SYSTEM.name
    ],
    systemPrompt: `You are a helpful AI assistant in rdtect OS. You can:
- Read and write files in the virtual file system
- Open and control applications
- Send messages to apps and other agents
- Help the user accomplish tasks

Always be helpful, concise, and respect user privacy.`
  });
}

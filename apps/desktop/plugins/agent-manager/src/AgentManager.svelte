<script lang="ts">
  /**
   * Agent Manager - AI Task Manager
   *
   * Monitor and manage AI agents in rdtect OS.
   * Features:
   * - List all agents with status indicators
   * - Create new agents with custom configurations
   * - View agent details, memory/context logs
   * - Manual action input (terminal-like interface)
   * - Start/Stop autonomous mode
   * - Delete agents with confirmation
   */
  import { onMount, onDestroy } from "svelte";
  import { agentRuntime, CAPABILITIES } from "$lib/core/agents";
  import type { Agent, AgentStatus, AgentModel, AgentMemory, AgentEvent } from "$lib/core/agents/types";

  // Props from window manager
  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  // View state
  type ViewMode = "list" | "create" | "detail";
  let viewMode = $state<ViewMode>("list");
  let selectedAgentId = $state<string | null>(null);

  // Create form state
  let formName = $state("");
  let formAvatar = $state("🤖");
  let formModel = $state<AgentModel>("claude-3-sonnet");
  let formSystemPrompt = $state("");
  let formCapabilities = $state<string[]>([
    CAPABILITIES.FILE_READ.name,
    CAPABILITIES.APP_OPEN.name,
    CAPABILITIES.MESSAGE.name,
    CAPABILITIES.SYSTEM.name
  ]);

  // Action input state
  let actionInput = $state("");
  let actionType = $state<string>("open_app");

  // Server task state
  let serverTaskInput = $state("");
  let serverTaskRunning = $state(false);

  // Event listeners cleanup
  let unsubscribers: (() => void)[] = [];

  // Available models
  const MODELS: { id: AgentModel; name: string }[] = [
    { id: "claude-3-opus", name: "Claude 3 Opus" },
    { id: "claude-3-sonnet", name: "Claude 3 Sonnet" },
    { id: "claude-3-haiku", name: "Claude 3 Haiku" },
    { id: "gpt-4", name: "GPT-4" },
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "local", name: "Local Model" }
  ];

  // Avatar emoji options
  const AVATARS = ["🤖", "🧠", "🦾", "👾", "🔮", "🎯", "💡", "⚡", "🚀", "🛠️", "📊", "🔬"];

  // Action types
  const ACTION_TYPES = [
    { id: "open_app", name: "Open App", placeholder: '{"appId": "calculator"}' },
    { id: "close_app", name: "Close App", placeholder: '{"windowId": "window-123"}' },
    { id: "read_file", name: "Read File", placeholder: '{"path": "/home/user/notes.md"}' },
    { id: "write_file", name: "Write File", placeholder: '{"path": "/home/user/test.txt", "content": "Hello"}' },
    { id: "list_directory", name: "List Directory", placeholder: '{"path": "/home/user"}' },
    { id: "emit_event", name: "Emit Event", placeholder: '{"event": "test:event", "data": {}}' }
  ];

  // Derived: agents list from runtime
  const agents = $derived(agentRuntime.agents);

  // Derived: selected agent
  const selectedAgent = $derived(
    selectedAgentId ? agentRuntime.getAgent(selectedAgentId) : null
  );

  // Status colors
  function getStatusColor(status: AgentStatus): string {
    switch (status) {
      case "idle": return "#22c55e";
      case "thinking": return "#eab308";
      case "acting": return "#3b82f6";
      case "waiting": return "#a855f7";
      case "error": return "#ef4444";
      default: return "#64748b";
    }
  }

  function getStatusLabel(status: AgentStatus): string {
    switch (status) {
      case "idle": return "Idle";
      case "thinking": return "Thinking";
      case "acting": return "Acting";
      case "waiting": return "Waiting";
      case "error": return "Error";
      default: return "Unknown";
    }
  }

  // Capability helpers
  function getCapabilityInfo(name: string): { label: string; description: string } {
    const cap = Object.values(CAPABILITIES).find(c => c.name === name);
    if (cap) {
      return {
        label: cap.name.split(":").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
        description: cap.description
      };
    }
    return { label: name, description: "" };
  }

  function toggleCapability(capName: string) {
    if (formCapabilities.includes(capName)) {
      formCapabilities = formCapabilities.filter(c => c !== capName);
    } else {
      formCapabilities = [...formCapabilities, capName];
    }
  }

  // View handlers
  function showCreateForm() {
    formName = "";
    formAvatar = "🤖";
    formModel = "claude-3-sonnet";
    formSystemPrompt = "";
    formCapabilities = [
      CAPABILITIES.FILE_READ.name,
      CAPABILITIES.APP_OPEN.name,
      CAPABILITIES.MESSAGE.name,
      CAPABILITIES.SYSTEM.name
    ];
    viewMode = "create";
  }

  function showAgentDetail(agentId: string) {
    selectedAgentId = agentId;
    viewMode = "detail";
  }

  function backToList() {
    viewMode = "list";
    selectedAgentId = null;
  }

  // Agent actions
  async function createAgent() {
    if (!formName.trim()) return;

    await agentRuntime.createAgent({
      name: formName.trim(),
      avatar: formAvatar,
      model: formModel,
      capabilities: formCapabilities,
      systemPrompt: formSystemPrompt || undefined
    });

    backToList();
  }

  async function deleteAgent(agentId: string) {
    if (!confirm(`Delete agent "${agentRuntime.getAgent(agentId)?.name}"? This cannot be undone.`)) {
      return;
    }
    await agentRuntime.deleteAgent(agentId);
    if (selectedAgentId === agentId) {
      backToList();
    }
  }

  async function toggleAutonomous(agentId: string) {
    const agent = agentRuntime.getAgent(agentId);
    if (!agent) return;

    if (agent.status === "idle" || agent.status === "error") {
      await agentRuntime.start(agentId, "Assist the user with their tasks");
    } else {
      await agentRuntime.stop(agentId);
    }
  }

  async function runServerTask() {
    if (!selectedAgentId || !serverTaskInput.trim()) return;
    serverTaskRunning = true;
    try {
      await agentRuntime.runServerAgent(selectedAgentId, serverTaskInput.trim());
      serverTaskInput = "";
    } finally {
      serverTaskRunning = false;
    }
  }

  async function executeAction() {
    if (!selectedAgentId || !actionInput.trim()) return;

    try {
      const params = JSON.parse(actionInput);
      await agentRuntime.execute(selectedAgentId, {
        type: actionType as any,
        params
      });
      actionInput = "";
    } catch (e) {
      console.error("Failed to execute action:", e);
      alert(`Invalid JSON: ${e instanceof Error ? e.message : e}`);
    }
  }

  function formatTimestamp(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(date);
  }

  function formatMemoryType(type: AgentMemory["type"]): { label: string; color: string } {
    switch (type) {
      case "observation": return { label: "OBS", color: "#22c55e" };
      case "action": return { label: "ACT", color: "#3b82f6" };
      case "thought": return { label: "THK", color: "#a855f7" };
      case "result": return { label: "RES", color: "#eab308" };
      default: return { label: "???", color: "#64748b" };
    }
  }

  // Subscribe to agent events for real-time updates
  onMount(() => {
    const events: AgentEvent["type"][] = [
      "agent:created",
      "agent:started",
      "agent:stopped",
      "agent:action",
      "agent:result",
      "agent:error",
      "agent:status"
    ];

    events.forEach(eventType => {
      const unsub = agentRuntime.on(eventType, (event) => {
        // Force reactivity update by touching the agents array
        // This ensures UI updates when agent status changes
        agentRuntime.agents = [...agentRuntime.agents];
      });
      unsubscribers.push(unsub);
    });

  });

  onDestroy(() => {
    unsubscribers.forEach(unsub => unsub());
  });
</script>

<div class="agent-manager">
  <!-- Header -->
  <header class="header">
    <div class="header-left">
      {#if viewMode !== "list"}
        <button class="back-btn" onclick={backToList}>
          <span class="arrow">&larr;</span>
        </button>
      {/if}
      <span class="icon">🤖</span>
      <h2>
        {#if viewMode === "create"}
          Create Agent
        {:else if viewMode === "detail" && selectedAgent}
          {selectedAgent.avatar} {selectedAgent.name}
        {:else}
          Agent Manager
        {/if}
      </h2>
    </div>
    <div class="header-right">
      {#if viewMode === "list"}
        <div class="agent-count">
          <span class="count">{agents.length}</span>
          <span class="label">agents</span>
        </div>
        <button class="new-btn" onclick={showCreateForm}>
          + New Agent
        </button>
      {/if}
      <div class="live-indicator">
        <span class="live-dot"></span>
        <span>LIVE</span>
      </div>
    </div>
  </header>

  <!-- Content -->
  <div class="content">
    {#if viewMode === "list"}
      <!-- Agents List View -->
      <div class="agents-grid">
        {#each agents as agent (agent.id)}
          <div class="agent-card" class:error={agent.status === "error"}>
            <div class="card-header">
              <span class="agent-avatar">{agent.avatar}</span>
              <div class="agent-info">
                <h3 class="agent-name">{agent.name}</h3>
                <span class="agent-model">{agent.model}</span>
              </div>
              <div class="status-badge" style="--status-color: {getStatusColor(agent.status)}">
                <span class="status-dot"></span>
                <span class="status-text">{getStatusLabel(agent.status)}</span>
              </div>
            </div>

            {#if agent.description}
              <p class="agent-description">{agent.description}</p>
            {/if}

            <div class="capabilities-row">
              {#each agent.capabilities.slice(0, 4) as cap}
                <span class="cap-badge" title={getCapabilityInfo(cap).description}>
                  {getCapabilityInfo(cap).label}
                </span>
              {/each}
              {#if agent.capabilities.length > 4}
                <span class="cap-badge more">+{agent.capabilities.length - 4}</span>
              {/if}
            </div>

            <div class="card-footer">
              <span class="last-active">
                Last active: {formatTimestamp(agent.lastActiveAt)}
              </span>
              <div class="card-actions">
                <button
                  class="action-btn auto"
                  class:active={agent.status !== "idle" && agent.status !== "error"}
                  onclick={() => toggleAutonomous(agent.id)}
                  title={agent.status === "idle" || agent.status === "error" ? "Start autonomous mode" : "Stop autonomous mode"}
                >
                  {agent.status === "idle" || agent.status === "error" ? "▶" : "⏹"}
                </button>
                <button
                  class="action-btn view"
                  onclick={() => showAgentDetail(agent.id)}
                  title="View details"
                >
                  ⚙
                </button>
                <button
                  class="action-btn delete"
                  onclick={() => deleteAgent(agent.id)}
                  title="Delete agent"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        {:else}
          <div class="empty-state">
            <span class="empty-icon">🤖</span>
            <h3>No Agents</h3>
            <p>Create your first AI agent to get started</p>
            <button class="new-btn" onclick={showCreateForm}>+ Create Agent</button>
          </div>
        {/each}
      </div>

    {:else if viewMode === "create"}
      <!-- Create Agent Form -->
      <div class="create-form">
        <div class="form-section">
          <label class="form-label">Agent Name</label>
          <input
            type="text"
            class="form-input"
            placeholder="Enter agent name..."
            bind:value={formName}
          />
        </div>

        <div class="form-section">
          <label class="form-label">Avatar</label>
          <div class="avatar-picker">
            {#each AVATARS as emoji}
              <button
                class="avatar-btn"
                class:selected={formAvatar === emoji}
                onclick={() => formAvatar = emoji}
              >
                {emoji}
              </button>
            {/each}
          </div>
        </div>

        <div class="form-section">
          <label class="form-label">Model</label>
          <select class="form-select" bind:value={formModel}>
            {#each MODELS as model}
              <option value={model.id}>{model.name}</option>
            {/each}
          </select>
        </div>

        <div class="form-section">
          <label class="form-label">Capabilities</label>
          <div class="capabilities-grid">
            {#each Object.values(CAPABILITIES) as cap}
              <label class="capability-checkbox">
                <input
                  type="checkbox"
                  checked={formCapabilities.includes(cap.name)}
                  onchange={() => toggleCapability(cap.name)}
                />
                <span class="checkbox-custom"></span>
                <div class="checkbox-content">
                  <span class="checkbox-label">{cap.name}</span>
                  <span class="checkbox-desc">{cap.description}</span>
                </div>
              </label>
            {/each}
          </div>
        </div>

        <div class="form-section">
          <label class="form-label">System Prompt (Optional)</label>
          <textarea
            class="form-textarea"
            placeholder="Define the agent's personality and behavior..."
            rows="4"
            bind:value={formSystemPrompt}
          ></textarea>
        </div>

        <div class="form-actions">
          <button class="cancel-btn" onclick={backToList}>Cancel</button>
          <button
            class="create-btn"
            disabled={!formName.trim()}
            onclick={createAgent}
          >
            Create Agent
          </button>
        </div>
      </div>

    {:else if viewMode === "detail" && selectedAgent}
      <!-- Agent Detail View -->
      <div class="detail-view">
        <!-- Status Section -->
        <div class="detail-section status-section">
          <div class="status-display" style="--status-color: {getStatusColor(selectedAgent.status)}">
            <span class="status-indicator"></span>
            <span class="status-label">{getStatusLabel(selectedAgent.status)}</span>
          </div>
          <div class="meta-info">
            <span class="meta-item">
              <span class="meta-label">Model:</span>
              <span class="meta-value">{selectedAgent.model}</span>
            </span>
            <span class="meta-item">
              <span class="meta-label">Created:</span>
              <span class="meta-value">{selectedAgent.createdAt.toLocaleDateString()}</span>
            </span>
          </div>
          <button
            class="autonomous-btn"
            class:active={selectedAgent.status !== "idle" && selectedAgent.status !== "error"}
            onclick={() => toggleAutonomous(selectedAgent.id)}
          >
            {#if selectedAgent.status === "idle" || selectedAgent.status === "error"}
              <span class="btn-icon">▶</span> Start Autonomous Mode
            {:else}
              <span class="btn-icon">⏹</span> Stop Autonomous Mode
            {/if}
          </button>
        </div>

        <!-- Capabilities -->
        <div class="detail-section">
          <h4 class="section-title">Capabilities</h4>
          <div class="capabilities-list">
            {#each selectedAgent.capabilities as cap}
              <span class="cap-tag">{getCapabilityInfo(cap).label}</span>
            {/each}
          </div>
        </div>

        <!-- Memory/Context Log -->
        <div class="detail-section memory-section">
          <h4 class="section-title">Memory Log</h4>
          <div class="memory-log">
            {#if selectedAgent.context?.memory && selectedAgent.context.memory.length > 0}
              {#each selectedAgent.context.memory.slice().reverse() as entry}
                <div class="log-entry">
                  <span
                    class="log-type"
                    style="background-color: {formatMemoryType(entry.type).color}"
                  >
                    {formatMemoryType(entry.type).label}
                  </span>
                  <span class="log-time">{formatTimestamp(entry.timestamp)}</span>
                  <span class="log-content">{entry.content}</span>
                </div>
              {/each}
            {:else}
              <div class="log-empty">No memory entries yet</div>
            {/if}
          </div>
        </div>

        <!-- Manual Action Input -->
        <div class="detail-section action-section">
          <h4 class="section-title">Manual Action</h4>
          <div class="action-input-row">
            <select class="action-select" bind:value={actionType}>
              {#each ACTION_TYPES as action}
                <option value={action.id}>{action.name}</option>
              {/each}
            </select>
            <input
              type="text"
              class="action-input"
              placeholder={ACTION_TYPES.find(a => a.id === actionType)?.placeholder || "{}"}
              bind:value={actionInput}
              onkeydown={(e) => e.key === "Enter" && executeAction()}
            />
            <button
              class="execute-btn"
              onclick={executeAction}
              disabled={!actionInput.trim()}
            >
              Execute
            </button>
          </div>
        </div>

        <!-- Server Task -->
        <div class="detail-section action-section">
          <h4 class="section-title">Run Server Task</h4>
          <div class="action-input-row">
            <input
              type="text"
              class="action-input"
              placeholder="Describe a task for the agent..."
              bind:value={serverTaskInput}
              onkeydown={(e) => e.key === "Enter" && !serverTaskRunning && runServerTask()}
              disabled={serverTaskRunning}
            />
            <button
              class="execute-btn"
              onclick={runServerTask}
              disabled={!serverTaskInput.trim() || serverTaskRunning}
            >
              {#if serverTaskRunning}
                <span class="spinner-small"></span> Running...
              {:else}
                Run on Server
              {/if}
            </button>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="detail-section danger-section">
          <button class="delete-agent-btn" onclick={() => deleteAgent(selectedAgent.id)}>
            Delete Agent
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .agent-manager {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
    font-family: var(--desktop-font-sans);
    font-size: var(--text-sm);
    color: #e2e8f0;
    overflow: hidden;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: rgba(99, 102, 241, 0.1);
    border-bottom: 1px solid rgba(99, 102, 241, 0.2);
    backdrop-filter: blur(var(--glass-blur));
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .back-btn {
    background: rgba(51, 65, 85, 0.5);
    border: none;
    color: #94a3b8;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .back-btn:hover {
    background: rgba(99, 102, 241, 0.3);
    color: #e2e8f0;
  }

  .arrow {
    font-size: 16px;
  }

  .icon {
    font-size: 20px;
  }

  .header h2 {
    font-size: 15px;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .agent-count {
    display: flex;
    align-items: baseline;
    gap: 4px;
    padding: 4px 10px;
    background: rgba(51, 65, 85, 0.5);
    border-radius: var(--radius-full);
  }

  .agent-count .count {
    font-size: 16px;
    font-weight: 700;
    color: #6366f1;
  }

  .agent-count .label {
    font-size: 11px;
    color: #94a3b8;
  }

  .new-btn {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    color: white;
    padding: 6px 14px;
    border-radius: var(--radius-md);
    font-size: var(--text-xs);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
    min-height: 44px;
  }

  .new-btn:hover {
    background: linear-gradient(135deg, #4f46e5, #4338ca);
    transform: translateY(-1px);
  }

  .live-indicator {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #22c55e;
    text-transform: uppercase;
  }

  .live-dot {
    width: 8px;
    height: 8px;
    background: #22c55e;
    border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;
    box-shadow: 0 0 8px #22c55e;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.85); }
  }

  /* Content */
  .content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .content::-webkit-scrollbar {
    width: var(--scrollbar-width);
  }

  .content::-webkit-scrollbar-track {
    background: transparent;
  }

  .content::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: var(--radius-full);
  }

  .content::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover);
  }

  /* Agents Grid */
  .agents-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }

  .agent-card {
    background: var(--glass-bg-default);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: var(--radius-lg);
    padding: 16px;
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .agent-card:hover {
    border-color: rgba(99, 102, 241, 0.4);
    transform: var(--card-hover-transform);
    box-shadow: var(--card-hover-shadow);
  }

  .agent-card.error {
    border-color: rgba(239, 68, 68, 0.4);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }

  .agent-avatar {
    font-size: 32px;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(99, 102, 241, 0.15);
    border-radius: var(--radius-lg);
  }

  .agent-info {
    flex: 1;
    min-width: 0;
  }

  .agent-name {
    font-size: 15px;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .agent-model {
    font-size: 11px;
    color: #64748b;
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: 500;
    color: var(--status-color);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--status-color);
    box-shadow: 0 0 6px var(--status-color);
  }

  .agent-description {
    font-size: 12px;
    color: #94a3b8;
    margin: 0 0 10px 0;
    line-height: 1.4;
  }

  .capabilities-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
  }

  .cap-badge {
    font-size: var(--text-xs);
    padding: 2px 8px;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.25);
    border-radius: var(--radius-full);
    color: #a5b4fc;
  }

  .cap-badge.more {
    background: rgba(51, 65, 85, 0.5);
    border-color: rgba(71, 85, 105, 0.3);
    color: #64748b;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    border-top: 1px solid rgba(51, 65, 85, 0.5);
  }

  .last-active {
    font-size: 10px;
    color: #64748b;
  }

  .card-actions {
    display: flex;
    gap: 6px;
  }

  .action-btn {
    width: 44px;
    height: 44px;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-sm);
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .action-btn:focus-visible {
    outline: 2px solid #6366f1;
    outline-offset: 2px;
  }

  .action-btn.auto {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
  }

  .action-btn.auto:hover {
    background: rgba(34, 197, 94, 0.3);
  }

  .action-btn.auto.active {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  .action-btn.view {
    background: rgba(99, 102, 241, 0.2);
    color: #6366f1;
  }

  .action-btn.view:hover {
    background: rgba(99, 102, 241, 0.3);
  }

  .action-btn.delete {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }

  .action-btn.delete:hover {
    background: rgba(239, 68, 68, 0.3);
  }

  /* Empty State */
  .empty-state {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
  }

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.6;
  }

  .empty-state h3 {
    font-size: 18px;
    color: #f1f5f9;
    margin: 0 0 8px 0;
  }

  .empty-state p {
    color: #64748b;
    margin: 0 0 20px 0;
  }

  /* Create Form */
  .create-form {
    max-width: 600px;
    margin: 0 auto;
  }

  .form-section {
    margin-bottom: 20px;
  }

  .form-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .form-input,
  .form-select,
  .form-textarea {
    width: 100%;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: var(--radius-md);
    padding: 10px 14px;
    color: #f1f5f9;
    font-size: var(--text-base);
    font-family: inherit;
    transition: border-color var(--transition-normal) var(--transition-easing);
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    outline: none;
    border-color: rgba(99, 102, 241, 0.5);
  }

  .form-input::placeholder,
  .form-textarea::placeholder {
    color: #475569;
  }

  .form-textarea {
    resize: vertical;
    min-height: 100px;
  }

  .avatar-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .avatar-btn {
    width: 44px;
    height: 44px;
    border: 2px solid rgba(51, 65, 85, 0.5);
    border-radius: var(--radius-lg);
    background: rgba(15, 23, 42, 0.6);
    font-size: 24px;
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .avatar-btn:hover {
    border-color: rgba(99, 102, 241, 0.5);
    transform: scale(1.05);
  }

  .avatar-btn.selected {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.2);
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.3);
  }

  .capabilities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
  }

  .capability-checkbox {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(51, 65, 85, 0.4);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .capability-checkbox:hover {
    border-color: rgba(99, 102, 241, 0.4);
  }

  .capability-checkbox input {
    display: none;
  }

  .checkbox-custom {
    width: 18px;
    height: 18px;
    border: 2px solid #475569;
    border-radius: 4px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .capability-checkbox input:checked + .checkbox-custom {
    background: #6366f1;
    border-color: #6366f1;
  }

  .capability-checkbox input:checked + .checkbox-custom::after {
    content: "✓";
    color: white;
    font-size: 12px;
    font-weight: bold;
  }

  .checkbox-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .checkbox-label {
    font-size: 12px;
    font-weight: 500;
    color: #e2e8f0;
  }

  .checkbox-desc {
    font-size: 10px;
    color: #64748b;
    line-height: 1.3;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid rgba(51, 65, 85, 0.4);
  }

  .cancel-btn {
    background: rgba(51, 65, 85, 0.5);
    border: none;
    color: #94a3b8;
    padding: 10px 20px;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
    min-height: 44px;
  }

  .cancel-btn:hover {
    background: rgba(51, 65, 85, 0.7);
    color: #e2e8f0;
  }

  .create-btn {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    color: white;
    padding: 10px 24px;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
    min-height: 44px;
  }

  .create-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #4f46e5, #4338ca);
    transform: translateY(-1px);
  }

  .create-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Detail View */
  .detail-view {
    max-width: 700px;
    margin: 0 auto;
  }

  .detail-section {
    background: var(--glass-bg-default);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: 16px;
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 12px 0;
  }

  /* Status Section */
  .status-section {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .status-display {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: var(--radius-md);
  }

  .status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--status-color);
    box-shadow: 0 0 10px var(--status-color);
    animation: pulse 2s ease-in-out infinite;
  }

  .status-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--status-color);
  }

  .meta-info {
    flex: 1;
    display: flex;
    gap: 20px;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .meta-label {
    font-size: 10px;
    color: #64748b;
    text-transform: uppercase;
  }

  .meta-value {
    font-size: 13px;
    color: #e2e8f0;
  }

  .autonomous-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-xs);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
    min-height: 44px;
  }

  .autonomous-btn:hover {
    background: rgba(34, 197, 94, 0.3);
  }

  .autonomous-btn.active {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  .autonomous-btn.active:hover {
    background: rgba(239, 68, 68, 0.3);
  }

  .btn-icon {
    font-size: 10px;
  }

  /* Capabilities List */
  .capabilities-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .cap-tag {
    padding: 6px 12px;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.25);
    border-radius: var(--radius-md);
    font-size: 12px;
    color: #a5b4fc;
  }

  /* Memory Log */
  .memory-section {
    max-height: 300px;
    display: flex;
    flex-direction: column;
  }

  .memory-log {
    flex: 1;
    overflow-y: auto;
    background: rgba(15, 23, 42, 0.5);
    border-radius: 8px;
    padding: 8px;
    font-family: "SF Mono", Monaco, Consolas, monospace;
    font-size: 11px;
  }

  .memory-log::-webkit-scrollbar {
    width: 4px;
  }

  .memory-log::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.3);
    border-radius: 2px;
  }

  .log-entry {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid rgba(51, 65, 85, 0.3);
  }

  .log-entry:last-child {
    border-bottom: none;
  }

  .log-type {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
  }

  .log-time {
    color: #64748b;
    flex-shrink: 0;
    font-size: 10px;
  }

  .log-content {
    color: #94a3b8;
    word-break: break-word;
    white-space: pre-wrap;
  }

  .log-empty {
    color: #475569;
    text-align: center;
    padding: 20px;
    font-style: italic;
  }

  /* Action Section */
  .action-input-row {
    display: flex;
    gap: 8px;
  }

  .action-select {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: 6px;
    padding: 8px 12px;
    color: #f1f5f9;
    font-size: 12px;
    cursor: pointer;
    min-width: 140px;
  }

  .action-input {
    flex: 1;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: 6px;
    padding: 8px 12px;
    color: #f1f5f9;
    font-size: 12px;
    font-family: "SF Mono", Monaco, Consolas, monospace;
  }

  .action-input::placeholder {
    color: #475569;
  }

  .execute-btn {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .execute-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #4f46e5, #4338ca);
  }

  .execute-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Danger Section */
  .danger-section {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.2);
  }

  .delete-agent-btn {
    width: 100%;
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    padding: 10px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .delete-agent-btn:hover {
    background: rgba(239, 68, 68, 0.3);
    border-color: rgba(239, 68, 68, 0.5);
  }

  .spinner-small {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>

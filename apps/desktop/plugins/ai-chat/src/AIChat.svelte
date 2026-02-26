<script lang="ts">
  /**
   * AI Chat - Enhanced with conversation persistence, markdown rendering,
   * multiple conversations, system prompt config, and export.
   */
  import { PUBLIC_PYTHON_API_URL } from "$env/static/public";
  import { onMount } from "svelte";

  interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
  }

  interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    created: number;
    updated: number;
    systemPrompt: string;
    model: string;
  }

  interface Props {
    windowId?: string;
  }

  let { windowId = "ai-chat-default" }: Props = $props();

  const MODELS = [
    { id: "claude-haiku-4-5-20251001", name: "Claude Haiku", description: "Fast & efficient" },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet", description: "Balanced" },
  ];

  const STORAGE_KEY = "ai-chat-conversations";

  // Conversation state
  let conversations = $state<Conversation[]>([]);
  let activeConversationId = $state<string | null>(null);
  let sidebarOpen = $state(true);
  let showSettings = $state(false);
  let showClearConfirm = $state(false);

  // Chat state
  let inputValue = $state("");
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let selectedModel = $state("claude-haiku-4-5-20251001");
  let useStreaming = $state(true);
  let useRag = $state(true);
  let streamingContent = $state("");
  let systemPrompt = $state("");
  let messagesContainer: HTMLDivElement;

  // Derived
  const activeConversation = $derived(
    conversations.find(c => c.id === activeConversationId) ?? null
  );
  const messages = $derived(activeConversation?.messages ?? []);

  // Persistence
  function loadConversations() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        conversations = JSON.parse(raw);
        if (conversations.length > 0 && !activeConversationId) {
          activeConversationId = conversations[0].id;
          systemPrompt = conversations[0].systemPrompt || "";
          selectedModel = conversations[0].model || "claude-haiku-4-5-20251001";
        }
      }
    } catch { /* ignore corrupt data */ }
  }

  function saveConversations() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch { /* storage full */ }
  }

  // Conversation management
  function createConversation() {
    const conv: Conversation = {
      id: crypto.randomUUID(),
      title: "New Chat",
      messages: [],
      created: Date.now(),
      updated: Date.now(),
      systemPrompt: "",
      model: selectedModel,
    };
    conversations = [conv, ...conversations];
    activeConversationId = conv.id;
    systemPrompt = "";
    error = null;
    saveConversations();
  }

  function switchConversation(id: string) {
    activeConversationId = id;
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      systemPrompt = conv.systemPrompt || "";
      selectedModel = conv.model || "claude-haiku-4-5-20251001";
    }
    error = null;
  }

  function deleteConversation(id: string) {
    conversations = conversations.filter(c => c.id !== id);
    if (activeConversationId === id) {
      activeConversationId = conversations.length > 0 ? conversations[0].id : null;
    }
    saveConversations();
  }

  function updateActiveMessages(msgs: ChatMessage[]) {
    if (!activeConversationId) return;
    conversations = conversations.map(c =>
      c.id === activeConversationId
        ? {
            ...c,
            messages: msgs,
            updated: Date.now(),
            title: c.title === "New Chat" && msgs.length > 0
              ? msgs.find(m => m.role === "user")?.content.slice(0, 40) || c.title
              : c.title,
            systemPrompt,
            model: selectedModel,
          }
        : c
    );
    saveConversations();
  }

  function scrollToBottom() {
    if (messagesContainer) {
      requestAnimationFrame(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      });
    }
  }

  // Markdown renderer
  function renderMarkdown(text: string): string {
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
      return `<pre class="md-code-block"><code class="lang-${lang}">${code.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`\n]+)`/g, '<code class="md-inline-code">$1</code>');

    // Bold + italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h2 class="md-h2">$1</h2>');

    // Unordered lists
    html = html.replace(/^- (.+)$/gm, '<li class="md-li">$1</li>');

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="md-li md-ol">$1</li>');

    // Line breaks (but not inside pre blocks)
    html = html.replace(/\n/g, "<br/>");

    // Clean up brs inside pre blocks
    html = html.replace(/<pre class="md-code-block"><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g,
      (_m, attrs, code) => `<pre class="md-code-block"><code${attrs}>${code.replace(/<br\/>/g, "\n")}</code></pre>`
    );

    return html;
  }

  // Export conversation as markdown
  function exportConversation() {
    if (!activeConversation) return;
    const lines = [`# ${activeConversation.title}\n`];
    if (activeConversation.systemPrompt) {
      lines.push(`> System: ${activeConversation.systemPrompt}\n`);
    }
    for (const msg of activeConversation.messages) {
      lines.push(`## ${msg.role === "user" ? "You" : "AI"}\n`);
      lines.push(msg.content + "\n");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeConversation.title.replace(/[^a-z0-9]/gi, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Send message
  async function handleSend() {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    if (!activeConversationId) {
      createConversation();
    }

    inputValue = "";
    isLoading = true;
    error = null;

    const newMsgs: ChatMessage[] = [...messages, { role: "user", content: text }];
    updateActiveMessages(newMsgs);
    scrollToBottom();

    if (useStreaming) {
      await sendWithStreaming(text, newMsgs);
    } else {
      await sendWithRemoteFunction(text, newMsgs);
    }
  }

  async function sendWithStreaming(text: string, currentMsgs: ChatMessage[]) {
    streamingContent = "";
    const msgsWithPlaceholder = [...currentMsgs, { role: "assistant" as const, content: "" }];
    updateActiveMessages(msgsWithPlaceholder);

    try {
      const response = await fetch(`${PUBLIC_PYTHON_API_URL}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: currentMsgs.map(m => ({ role: m.role, content: m.content })),
          use_rag: useRag,
          system: systemPrompt || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.detail || "Stream failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.token) {
                streamingContent += parsed.token;
                const updatedMsgs = currentMsgs.concat([
                  { role: "assistant", content: streamingContent },
                ]);
                updateActiveMessages(updatedMsgs);
                scrollToBottom();
              }
            } catch { /* skip malformed */ }
          }
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Stream failed";
      updateActiveMessages(currentMsgs);
    } finally {
      isLoading = false;
      streamingContent = "";
    }
  }

  async function sendWithRemoteFunction(text: string, currentMsgs: ChatMessage[]) {
    try {
      const response = await fetch(`${PUBLIC_PYTHON_API_URL}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: currentMsgs.map(m => ({ role: m.role, content: m.content })),
          use_rag: useRag,
          system: systemPrompt || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.detail || "Request failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.token) fullContent += parsed.token;
              } catch { /* skip */ }
            }
          }
        }
      }

      const updatedMsgs = [...currentMsgs, { role: "assistant" as const, content: fullContent }];
      updateActiveMessages(updatedMsgs);
      scrollToBottom();
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to send message";
    } finally {
      isLoading = false;
    }
  }

  function handleClear() {
    if (!activeConversationId) return;
    updateActiveMessages([]);
    error = null;
    showClearConfirm = false;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  onMount(() => {
    loadConversations();
    if (conversations.length === 0) {
      createConversation();
    }
  });
</script>

<div class="chat-container">
  <!-- Sidebar -->
  {#if sidebarOpen}
    <aside class="chat-sidebar">
      <div class="sidebar-header">
        <h3 class="sidebar-title">Chats</h3>
        <button class="icon-btn" onclick={createConversation} title="New Chat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
      <div class="conversation-list">
        {#each conversations as conv (conv.id)}
          <button
            class="conv-item"
            class:active={conv.id === activeConversationId}
            onclick={() => switchConversation(conv.id)}
          >
            <span class="conv-title">{conv.title}</span>
            <span class="conv-meta">
              <span class="conv-count">{conv.messages.length} msgs</span>
              <span class="conv-time">{formatTime(conv.updated)}</span>
            </span>
            <button
              class="conv-delete"
              onclick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
              title="Delete"
            >&times;</button>
          </button>
        {/each}
      </div>
    </aside>
  {/if}

  <!-- Main chat area -->
  <div class="chat-main">
    <!-- Header -->
    <header class="chat-header">
      <div class="header-left">
        <button class="icon-btn" onclick={() => sidebarOpen = !sidebarOpen} title="Toggle sidebar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span class="chat-icon">🤖</span>
        <h2 class="chat-title">AI Assistant</h2>
      </div>
      <div class="header-right">
        <select bind:value={selectedModel} class="model-select" disabled={isLoading}>
          {#each MODELS as model}
            <option value={model.id}>{model.name}</option>
          {/each}
        </select>
        <label class="toggle-label">
          <input type="checkbox" bind:checked={useRag} /><span>RAG</span>
        </label>
        <label class="toggle-label">
          <input type="checkbox" bind:checked={useStreaming} /><span>Stream</span>
        </label>
        <button class="icon-btn" onclick={() => showSettings = !showSettings} title="Settings">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </button>
        <button class="icon-btn" onclick={exportConversation} title="Export" disabled={!activeConversation || messages.length === 0}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
        <button
          class="icon-btn"
          onclick={() => showClearConfirm = true}
          disabled={isLoading || messages.length === 0}
          title="Clear chat"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Settings Panel -->
    {#if showSettings}
      <div class="settings-panel">
        <label class="settings-label">System Prompt</label>
        <textarea
          class="settings-textarea"
          bind:value={systemPrompt}
          placeholder="Set a system prompt to guide AI behavior..."
          rows="3"
        ></textarea>
      </div>
    {/if}

    <!-- Messages -->
    <div class="messages" bind:this={messagesContainer}>
      {#if messages.length === 0}
        <div class="empty-state">
          <span class="empty-icon">💬</span>
          <p class="empty-title">Start a conversation</p>
          <p class="empty-hint">Powered by Claude + RAG</p>
        </div>
      {:else}
        {#each messages as message, i (i)}
          <div class="message {message.role}">
            <div class="avatar">{message.role === "user" ? "👤" : "🤖"}</div>
            <div class="content">
              <div class="role">{message.role === "user" ? "You" : "AI"}</div>
              {#if message.role === "assistant"}
                <div class="text md-content">{@html renderMarkdown(message.content || "...")}</div>
              {:else}
                <div class="text">{message.content}</div>
              {/if}
            </div>
          </div>
        {/each}
        {#if isLoading && streamingContent === ""}
          <div class="message assistant">
            <div class="avatar">🤖</div>
            <div class="content">
              <div class="role">AI</div>
              <div class="typing-indicator">
                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
              </div>
            </div>
          </div>
        {/if}
      {/if}
    </div>

    <!-- Error -->
    {#if error}
      <div class="error-banner">
        <span>⚠️ {error}</span>
        <button onclick={() => (error = null)}>&times;</button>
      </div>
    {/if}

    <!-- Clear confirmation -->
    {#if showClearConfirm}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="confirm-overlay" onclick={() => showClearConfirm = false}>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="confirm-dialog" onclick={(e) => e.stopPropagation()}>
          <h3>Clear Chat</h3>
          <p>Are you sure? This will remove all messages in this conversation.</p>
          <div class="confirm-actions">
            <button class="confirm-btn cancel" onclick={() => showClearConfirm = false}>Cancel</button>
            <button class="confirm-btn delete" onclick={handleClear}>Clear</button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Input -->
    <div class="input-area">
      <textarea
        bind:value={inputValue}
        placeholder="Type a message..."
        onkeydown={handleKeyDown}
        disabled={isLoading}
        rows="1"
      ></textarea>
      <button onclick={handleSend} disabled={isLoading || !inputValue.trim()} class="send-btn">
        {#if isLoading}
          <span class="spinner"></span>
        {:else}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .chat-container {
    display: flex;
    height: 100%;
    background: rgba(15, 23, 42, 0.95);
    font-family: var(--desktop-font-sans);
  }

  /* === Sidebar === */
  .chat-sidebar {
    width: 240px;
    min-width: 240px;
    display: flex;
    flex-direction: column;
    background: rgba(30, 41, 59, 0.9);
    border-right: 1px solid rgba(51, 65, 85, 0.6);
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid rgba(51, 65, 85, 0.4);
  }

  .sidebar-title {
    margin: 0;
    font-size: var(--text-sm);
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .conversation-list {
    flex: 1;
    overflow-y: auto;
    padding: 6px;
  }

  .conv-item {
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 100%;
    padding: 10px 12px;
    margin-bottom: 2px;
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    text-align: left;
    cursor: pointer;
    color: #e2e8f0;
    transition: background var(--transition-fast);
    position: relative;
  }

  .conv-item:hover { background: rgba(99, 102, 241, 0.1); }
  .conv-item.active {
    background: rgba(99, 102, 241, 0.15);
    border-left: 2px solid #6366f1;
  }

  .conv-title {
    font-size: var(--text-sm);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 20px;
  }

  .conv-meta {
    display: flex;
    gap: 8px;
    font-size: var(--text-xs);
    color: #64748b;
  }

  .conv-delete {
    position: absolute;
    top: 8px;
    right: 6px;
    background: none;
    border: none;
    color: #64748b;
    font-size: 16px;
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--transition-fast);
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
  }

  .conv-item:hover .conv-delete { opacity: 1; }
  .conv-delete:hover { color: #ef4444; background: rgba(239, 68, 68, 0.15); }

  /* === Main Chat === */
  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    position: relative;
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(51, 65, 85, 0.6);
    background: var(--glass-bg-strong);
    flex-shrink: 0;
  }

  .header-left, .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .icon-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    color: #94a3b8;
    cursor: pointer;
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }

  .icon-btn:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.15);
    color: #c7d2fe;
    border-color: rgba(99, 102, 241, 0.2);
  }

  .icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .chat-icon { font-size: 18px; }
  .chat-title {
    font-size: var(--text-md);
    font-weight: 600;
    color: #f1f5f9;
    margin: 0;
  }

  .model-select {
    background: rgba(51, 65, 85, 0.6);
    border: 1px solid rgba(71, 85, 105, 0.5);
    border-radius: var(--radius-sm);
    padding: 4px 8px;
    font-size: var(--text-xs);
    color: #e2e8f0;
    cursor: pointer;
    min-height: 32px;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--text-xs);
    color: #94a3b8;
    cursor: pointer;
  }

  .toggle-label input { cursor: pointer; }

  /* === Settings Panel === */
  .settings-panel {
    padding: 12px 16px;
    background: rgba(30, 41, 59, 0.6);
    border-bottom: 1px solid rgba(51, 65, 85, 0.4);
    flex-shrink: 0;
  }

  .settings-label {
    display: block;
    font-size: var(--text-xs);
    font-weight: 600;
    color: #94a3b8;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .settings-textarea {
    width: 100%;
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: var(--radius-md);
    padding: 8px 12px;
    color: #e2e8f0;
    font-size: var(--text-sm);
    font-family: inherit;
    resize: vertical;
    outline: none;
    box-sizing: border-box;
  }

  .settings-textarea:focus { border-color: rgba(99, 102, 241, 0.5); }
  .settings-textarea::placeholder { color: #475569; }

  /* === Messages === */
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #94a3b8;
    text-align: center;
    gap: 8px;
    padding: 40px 24px;
  }

  .empty-icon { font-size: 48px; opacity: 0.35; }
  .empty-title { margin: 0; font-size: var(--text-md); font-weight: 600; }
  .empty-hint { margin: 0; font-size: var(--text-sm); color: #64748b; }

  .message {
    display: flex;
    gap: 10px;
    max-width: 85%;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .message.user { align-self: flex-end; flex-direction: row-reverse; }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(51, 65, 85, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }

  .message.user .avatar { background: rgba(99, 102, 241, 0.3); }

  .content {
    background: var(--glass-bg-strong);
    padding: 10px 14px;
    border-radius: var(--radius-lg);
    border: 1px solid rgba(51, 65, 85, 0.5);
    min-width: 0;
  }

  .message.user .content {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.8), rgba(79, 70, 229, 0.8));
    border-color: rgba(129, 140, 248, 0.3);
  }

  .role {
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    color: #94a3b8;
    margin-bottom: 4px;
  }

  .message.user .role { color: rgba(199, 210, 254, 0.9); text-align: right; }

  .text {
    color: #e2e8f0;
    font-size: var(--text-base);
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  /* Markdown content styles */
  .md-content { white-space: normal; }
  .md-content :global(.md-code-block) {
    background: rgba(0, 0, 0, 0.3);
    border-radius: var(--radius-md);
    padding: 12px;
    margin: 8px 0;
    overflow-x: auto;
    font-family: var(--desktop-font-mono);
    font-size: var(--text-sm);
    color: #e2e8f0;
    white-space: pre;
    line-height: 1.5;
  }

  .md-content :global(.md-inline-code) {
    background: rgba(99, 102, 241, 0.2);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: var(--desktop-font-mono);
    font-size: 0.85em;
    color: #a5b4fc;
  }

  .md-content :global(strong) { color: #f1f5f9; font-weight: 600; }
  .md-content :global(em) { color: #cbd5e1; }
  .md-content :global(.md-h2) { font-size: 1.1rem; font-weight: 600; color: #f1f5f9; margin: 12px 0 6px; }
  .md-content :global(.md-h3) { font-size: 1rem; font-weight: 600; color: #f1f5f9; margin: 10px 0 4px; }
  .md-content :global(.md-h4) { font-size: 0.9rem; font-weight: 600; color: #e2e8f0; margin: 8px 0 4px; }
  .md-content :global(.md-li) { margin-left: 16px; margin-bottom: 2px; }

  /* Typing indicator */
  .typing-indicator {
    display: flex;
    gap: 4px;
    padding: 4px 0;
  }

  .dot {
    width: 8px;
    height: 8px;
    background: #6366f1;
    border-radius: 50%;
    animation: bounce 1.4s ease-in-out infinite;
  }

  .dot:nth-child(2) { animation-delay: 0.16s; }
  .dot:nth-child(3) { animation-delay: 0.32s; }

  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-6px); opacity: 1; }
  }

  /* === Error === */
  .error-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: var(--color-error-bg);
    border-top: 1px solid var(--color-error-border);
    color: var(--color-error-text);
    font-size: var(--text-sm);
    flex-shrink: 0;
  }

  .error-banner button {
    background: none;
    border: none;
    color: var(--color-error-text);
    cursor: pointer;
    font-size: var(--text-md);
    min-width: 36px;
    min-height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* === Confirm Dialog === */
  .confirm-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .confirm-dialog {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: var(--radius-xl);
    padding: 24px;
    max-width: 340px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }

  .confirm-dialog h3 { margin: 0 0 8px; font-size: 1.1rem; color: #f1f5f9; }
  .confirm-dialog p { margin: 0 0 20px; font-size: var(--text-sm); color: #94a3b8; line-height: 1.5; }

  .confirm-actions { display: flex; gap: 8px; justify-content: flex-end; }

  .confirm-btn {
    padding: 8px 16px;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    border: none;
    min-height: 44px;
    transition: all var(--transition-fast);
  }

  .confirm-btn.cancel { background: rgba(99, 102, 241, 0.15); color: #a5b4fc; }
  .confirm-btn.cancel:hover { background: rgba(99, 102, 241, 0.25); }
  .confirm-btn.delete { background: #ef4444; color: white; }
  .confirm-btn.delete:hover { background: #dc2626; }

  /* === Input === */
  .input-area {
    display: flex;
    gap: 10px;
    padding: 12px 16px;
    border-top: 1px solid rgba(51, 65, 85, 0.5);
    background: var(--glass-bg-strong);
    flex-shrink: 0;
  }

  .input-area textarea {
    flex: 1;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: var(--radius-lg);
    padding: 10px 14px;
    color: #f1f5f9;
    font-size: var(--text-base);
    resize: none;
    min-height: 40px;
    max-height: 120px;
    outline: none;
    font-family: inherit;
  }

  .input-area textarea::placeholder { color: #64748b; }
  .input-area textarea:focus {
    border-color: rgba(99, 102, 241, 0.6);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
  }
  .input-area textarea:disabled { opacity: 0.5; }

  .send-btn {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    color: white;
    padding: 0 16px;
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-fast);
    min-width: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .send-btn:hover:not(:disabled) { background: linear-gradient(135deg, #4f46e5, #4338ca); }
  .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @media (prefers-reduced-motion: reduce) {
    .message { animation: none; }
    .spinner { animation-duration: 2s; }
    .dot { animation: none; opacity: 0.6; }
  }
</style>

<script lang="ts">
  /**
   * AI Chat - Native Component connecting to Python backend (Claude API + RAG)
   *
   * Streams responses via SSE from the Python backend.
   * Supports RAG (Retrieval-Augmented Generation) toggle.
   */
  import { PUBLIC_PYTHON_API_URL } from "$env/static/public";

  interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
  }

  interface Props {
    windowId?: string;
  }

  let { windowId = "ai-chat-default" }: Props = $props();

  const MODELS = [
    { id: "claude-haiku-4-5-20251001", name: "Claude Haiku", description: "Fast & efficient" },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet", description: "Balanced" },
  ];

  let messages = $state<ChatMessage[]>([]);
  let inputValue = $state("");
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let selectedModel = $state("claude-haiku-4-5-20251001");
  let useStreaming = $state(true);
  let useRag = $state(true);
  let streamingContent = $state("");
  let messagesContainer: HTMLDivElement;

  function scrollToBottom() {
    if (messagesContainer) {
      requestAnimationFrame(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      });
    }
  }

  async function handleSend() {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    inputValue = "";
    isLoading = true;
    error = null;

    // Add user message immediately
    messages = [...messages, { role: "user", content: text }];
    scrollToBottom();

    if (useStreaming) {
      await sendWithStreaming(text);
    } else {
      await sendWithRemoteFunction(text);
    }
  }

  async function sendWithStreaming(text: string) {
    streamingContent = "";

    // Add placeholder for assistant response
    messages = [...messages, { role: "assistant", content: "" }];

    try {
      const response = await fetch(`${PUBLIC_PYTHON_API_URL}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.slice(0, -1).map((m) => ({
            role: m.role,
            content: m.content
          })),
          use_rag: useRag,
          system: null
        })
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
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.token) {
                streamingContent += parsed.token;
                // Update the last message with streaming content
                messages = messages.map((m, i) =>
                  i === messages.length - 1 ? { ...m, content: streamingContent } : m
                );
                scrollToBottom();
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Stream failed";
      // Remove the failed assistant message
      messages = messages.slice(0, -1);
    } finally {
      isLoading = false;
      streamingContent = "";
    }
  }

  async function sendWithRemoteFunction(text: string) {
    try {
      const response = await fetch(`${PUBLIC_PYTHON_API_URL}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          use_rag: useRag,
          system: null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.detail || "Request failed");
      }

      // Collect entire streamed response
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

      messages = [...messages, { role: "assistant", content: fullContent }];
      scrollToBottom();
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to send message";
    } finally {
      isLoading = false;
    }
  }

  function handleClear() {
    messages = [];
    error = null;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }
</script>

<div class="chat-container">
  <!-- Header -->
  <header class="chat-header">
    <div class="header-left">
      <span class="chat-icon">🤖</span>
      <h2 class="chat-title">AI Assistant</h2>
    </div>
    <div class="header-right">
      <select bind:value={selectedModel} class="model-select" disabled={isLoading}>
        {#each MODELS as model}
          <option value={model.id}>{model.name}</option>
        {/each}
      </select>
      <label class="stream-toggle">
        <input type="checkbox" bind:checked={useRag} />
        <span>RAG</span>
      </label>
      <label class="stream-toggle">
        <input type="checkbox" bind:checked={useStreaming} />
        <span>Stream</span>
      </label>
      <button onclick={handleClear} class="clear-btn" disabled={isLoading || messages.length === 0}>
        Clear
      </button>
    </div>
  </header>

  <!-- Messages -->
  <div class="messages" bind:this={messagesContainer}>
    {#if messages.length === 0}
      <div class="empty-state">
        <span class="empty-icon">💬</span>
        <p>Start a conversation with AI</p>
        <p class="hint">Powered by Claude + RAG</p>
      </div>
    {:else}
      {#each messages as message, i (i)}
        <div class="message {message.role}">
          <div class="avatar">
            {message.role === "user" ? "👤" : "🤖"}
          </div>
          <div class="content">
            <div class="role">{message.role === "user" ? "You" : "AI"}</div>
            <div class="text">{message.content || "..."}</div>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Error display -->
  {#if error}
    <div class="error-banner">
      <span>⚠️</span>
      <span>{error}</span>
      <button onclick={() => (error = null)}>×</button>
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
        Send
      {/if}
    </button>
  </div>
</div>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: rgba(15, 23, 42, 0.95);
    font-family: var(--desktop-font-sans);
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(51, 65, 85, 0.6);
    background: var(--glass-bg-strong);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .chat-icon {
    font-size: 20px;
  }

  .chat-title {
    font-size: var(--text-md);
    font-weight: 600;
    color: #f1f5f9;
    margin: 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
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

  .stream-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--text-xs);
    color: #94a3b8;
    cursor: pointer;
  }

  .stream-toggle input {
    cursor: pointer;
  }

  .clear-btn {
    background: rgba(71, 85, 105, 0.5);
    border: none;
    border-radius: var(--radius-sm);
    padding: 4px 10px;
    font-size: var(--text-xs);
    color: #94a3b8;
    cursor: pointer;
    transition: all var(--transition-normal);
    min-height: 32px;
  }

  .clear-btn:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.3);
    color: #c7d2fe;
  }

  .clear-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

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

  .empty-icon {
    font-size: 48px;
    opacity: 0.35;
    line-height: 1;
  }

  .empty-state p {
    margin: 0;
    font-size: var(--text-md);
    font-weight: 600;
  }

  .hint {
    font-size: var(--text-sm);
    color: #64748b;
  }

  .message {
    display: flex;
    gap: 10px;
    max-width: 85%;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .message.user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }

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

  .message.user .avatar {
    background: rgba(99, 102, 241, 0.3);
  }

  .content {
    background: var(--glass-bg-strong);
    padding: 10px 14px;
    border-radius: var(--radius-lg);
    border: 1px solid rgba(51, 65, 85, 0.5);
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

  .message.user .role {
    color: rgba(199, 210, 254, 0.9);
    text-align: right;
  }

  .text {
    color: #e2e8f0;
    font-size: var(--text-base);
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: var(--color-error-bg);
    border-top: 1px solid var(--color-error-border);
    color: var(--color-error-text);
    font-size: var(--text-sm);
  }

  .error-banner button {
    margin-left: auto;
    background: none;
    border: none;
    color: var(--color-error-text);
    cursor: pointer;
    font-size: var(--text-md);
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .input-area {
    display: flex;
    gap: 10px;
    padding: 12px 16px;
    border-top: 1px solid rgba(51, 65, 85, 0.5);
    background: var(--glass-bg-strong);
  }

  textarea {
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

  textarea::placeholder {
    color: #64748b;
  }

  textarea:focus {
    border-color: rgba(99, 102, 241, 0.6);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
  }

  textarea:disabled {
    opacity: 0.5;
  }

  .send-btn {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    color: white;
    padding: 0 20px;
    border-radius: var(--radius-lg);
    font-weight: 600;
    font-size: var(--text-base);
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
    min-width: 70px;
  }

  .send-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #4f46e5, #4338ca);
  }

  .send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  textarea:focus-visible,
  .send-btn:focus-visible {
    outline: 2px solid rgba(99, 102, 241, 0.6);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .message {
      animation: none;
    }
    .spinner {
      animation-duration: 2s;
    }
  }
</style>

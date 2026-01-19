<script lang="ts">
  /**
   * AI Chat - Native Component using SvelteKit Remote Functions
   *
   * Uses remote functions for server-side AI communication.
   * Supports both instant responses and streaming.
   */
  import { onMount } from "svelte";
  import {
    sendMessage,
    getChatHistory,
    clearChatHistory,
    getAvailableModels,
    type ChatMessage
  } from "$lib/ai/chat.remote";

  interface Props {
    windowId?: string;
  }

  let { windowId = "ai-chat-default" }: Props = $props();

  let messages = $state<ChatMessage[]>([]);
  let inputValue = $state("");
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let selectedModel = $state("gpt-4o-mini");
  let models = $state<Array<{ id: string; name: string; description: string }>>([]);
  let useStreaming = $state(true);
  let streamingContent = $state("");
  let messagesContainer: HTMLDivElement;

  const sessionId = `${windowId}-${Date.now()}`;

  onMount(async () => {
    // Load available models
    try {
      models = await getAvailableModels();
    } catch (e) {
      console.error("Failed to load models:", e);
      models = [{ id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Default" }];
    }

    // Load existing history
    try {
      messages = await getChatHistory({ sessionId });
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  });

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
      const response = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.slice(0, -1).map((m) => ({
            role: m.role,
            content: m.content
          })),
          model: selectedModel
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Stream failed");
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
              if (parsed.content) {
                streamingContent += parsed.content;
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
      const result = await sendMessage({
        sessionId,
        message: text,
        model: selectedModel
      });
      messages = [...messages, result.message];
      scrollToBottom();
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to send message";
    } finally {
      isLoading = false;
    }
  }

  async function handleClear() {
    try {
      await clearChatHistory({ sessionId });
      messages = [];
      error = null;
    } catch (e) {
      error = "Failed to clear history";
    }
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
        {#each models as model}
          <option value={model.id}>{model.name}</option>
        {/each}
      </select>
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
        <p class="hint">Using SvelteKit remote functions</p>
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
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(51, 65, 85, 0.6);
    background: rgba(30, 41, 59, 0.8);
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
    font-size: 15px;
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
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 12px;
    color: #e2e8f0;
    cursor: pointer;
  }

  .stream-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #94a3b8;
    cursor: pointer;
  }

  .stream-toggle input {
    cursor: pointer;
  }

  .clear-btn {
    background: rgba(71, 85, 105, 0.5);
    border: none;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 12px;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s;
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
    color: #64748b;
    text-align: center;
  }

  .empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
  }

  .empty-state p {
    margin: 4px 0;
  }

  .hint {
    font-size: 12px;
    color: #475569;
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
    background: rgba(30, 41, 59, 0.8);
    padding: 10px 14px;
    border-radius: 12px;
    border: 1px solid rgba(51, 65, 85, 0.5);
  }

  .message.user .content {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.8), rgba(79, 70, 229, 0.8));
    border-color: rgba(129, 140, 248, 0.3);
  }

  .role {
    font-size: 10px;
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
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(239, 68, 68, 0.2);
    border-top: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
    font-size: 13px;
  }

  .error-banner button {
    margin-left: auto;
    background: none;
    border: none;
    color: #fca5a5;
    cursor: pointer;
    font-size: 16px;
  }

  .input-area {
    display: flex;
    gap: 10px;
    padding: 12px 16px;
    border-top: 1px solid rgba(51, 65, 85, 0.5);
    background: rgba(30, 41, 59, 0.8);
  }

  textarea {
    flex: 1;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: 10px;
    padding: 10px 14px;
    color: #f1f5f9;
    font-size: 14px;
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
    border-radius: 10px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
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
</style>

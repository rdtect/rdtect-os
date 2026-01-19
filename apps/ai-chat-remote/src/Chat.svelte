<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  interface Props {
    windowId?: string;
  }

  interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
  }

  let { windowId }: Props = $props();

  // State
  let messages = $state<Message[]>([]);
  let input = $state('');
  let isConnected = $state(false);
  let isLoading = $state(false);
  let ws: WebSocket | null = null;
  let messagesContainer: HTMLDivElement;

  // WebSocket URL (Python backend)
  const WS_URL = 'ws://localhost:8000/api/chat/ws';

  function connect() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      isConnected = true;
      addMessage('system', 'Connected to AI backend');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'start') {
          // Start of response
          addMessage('assistant', '');
          isLoading = true;
        } else if (data.type === 'chunk') {
          // Streaming chunk
          appendToLastMessage(data.content);
        } else if (data.type === 'complete') {
          // End of response
          isLoading = false;
        } else if (data.type === 'error') {
          addMessage('system', `Error: ${data.error}`);
          isLoading = false;
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };

    ws.onclose = () => {
      isConnected = false;
      addMessage('system', 'Disconnected from server');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      addMessage('system', 'Connection error. Make sure the Python backend is running.');
    };
  }

  function disconnect() {
    if (ws) {
      ws.close();
      ws = null;
    }
  }

  function addMessage(role: 'user' | 'assistant' | 'system', content: string) {
    messages = [...messages, { role, content, timestamp: Date.now() }];
    scrollToBottom();
  }

  function appendToLastMessage(content: string) {
    if (messages.length > 0) {
      const lastIdx = messages.length - 1;
      messages = messages.map((m, i) =>
        i === lastIdx ? { ...m, content: m.content + content } : m
      );
      scrollToBottom();
    }
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    });
  }

  function sendMessage() {
    if (!input.trim() || !ws || !isConnected) return;

    const content = input.trim();
    addMessage('user', content);
    ws.send(JSON.stringify({ message: content }));
    input = '';
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  onMount(() => {
    connect();
  });

  onDestroy(() => {
    disconnect();
  });
</script>

<div class="chat-container">
  <div class="header">
    <div class="title">
      <span class="icon">🤖</span>
      <span>AI Assistant</span>
    </div>
    <div class="status" class:connected={isConnected}>
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  </div>

  <div class="messages" bind:this={messagesContainer}>
    {#each messages as msg (msg.timestamp)}
      <div class="message {msg.role}">
        <div class="avatar">
          {msg.role === 'user' ? '👤' : msg.role === 'assistant' ? '🤖' : 'ℹ️'}
        </div>
        <div class="content">
          <div class="role">{msg.role}</div>
          <div class="text">{msg.content || (isLoading && msg.role === 'assistant' ? '...' : '')}</div>
        </div>
      </div>
    {/each}

    {#if messages.length === 0}
      <div class="empty">
        <p>Start a conversation with the AI assistant.</p>
        <p class="hint">Make sure the Python backend is running on port 8000.</p>
      </div>
    {/if}
  </div>

  <div class="input-area">
    <textarea
      bind:value={input}
      onkeydown={handleKeydown}
      placeholder="Type a message... (Enter to send)"
      disabled={!isConnected || isLoading}
    ></textarea>
    <button onclick={sendMessage} disabled={!isConnected || isLoading || !input.trim()}>
      Send
    </button>
  </div>

  <div class="badge">Federation Plugin</div>
</div>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border-radius: 8px;
    overflow: hidden;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    border-bottom: 1px solid rgba(51, 65, 85, 0.6);
    background: rgba(30, 41, 59, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    color: #f1f5f9;
    font-size: 15px;
  }

  .icon {
    font-size: 22px;
  }

  .status {
    font-size: 11px;
    padding: 5px 14px;
    border-radius: 16px;
    background: rgba(71, 85, 105, 0.5);
    color: #94a3b8;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .status.connected {
    background: rgba(22, 101, 52, 0.6);
    color: #86efac;
    box-shadow: 0 0 12px rgba(134, 239, 172, 0.2);
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    scrollbar-width: thin;
    scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
  }

  .messages::-webkit-scrollbar {
    width: 6px;
  }

  .messages::-webkit-scrollbar-track {
    background: transparent;
  }

  .messages::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.3);
    border-radius: 3px;
  }

  .message {
    display: flex;
    gap: 12px;
    max-width: 85%;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
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

  .message.system {
    align-self: center;
    max-width: 100%;
  }

  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(51, 65, 85, 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
    border: 1px solid rgba(99, 102, 241, 0.2);
  }

  .message.user .avatar {
    background: rgba(99, 102, 241, 0.3);
    border-color: rgba(99, 102, 241, 0.4);
  }

  .content {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 14px 18px;
    border-radius: 16px;
    border: 1px solid rgba(51, 65, 85, 0.5);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .message.user .content {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.8), rgba(79, 70, 229, 0.8));
    border-color: rgba(129, 140, 248, 0.3);
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.25);
  }

  .message.system .content {
    background: transparent;
    border: none;
    text-align: center;
    color: #64748b;
    font-size: 12px;
    box-shadow: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  .role {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    color: #94a3b8;
    margin-bottom: 6px;
    letter-spacing: 0.05em;
  }

  .message.user .role {
    color: rgba(199, 210, 254, 0.9);
    text-align: right;
  }

  .text {
    color: #e2e8f0;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .empty {
    text-align: center;
    color: #64748b;
    margin-top: 60px;
    padding: 30px;
    background: rgba(30, 41, 59, 0.4);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-radius: 16px;
    border: 1px solid rgba(51, 65, 85, 0.3);
  }

  .empty p {
    margin: 10px 0;
  }

  .hint {
    font-size: 12px;
    color: #475569;
  }

  .input-area {
    display: flex;
    gap: 10px;
    padding: 16px 18px;
    border-top: 1px solid rgba(51, 65, 85, 0.5);
    background: rgba(30, 41, 59, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  textarea {
    flex: 1;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: 12px;
    padding: 12px 16px;
    color: #f1f5f9;
    font-size: 14px;
    resize: none;
    height: 48px;
    outline: none;
    font-family: inherit;
    transition: all 0.2s ease;
  }

  textarea::placeholder {
    color: #64748b;
  }

  textarea:focus {
    border-color: rgba(99, 102, 241, 0.6);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    background: rgba(15, 23, 42, 0.8);
  }

  textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    color: white;
    padding: 0 24px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }

  button:hover:not(:disabled) {
    background: linear-gradient(135deg, #4f46e5, #4338ca);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
    transform: translateY(-1px);
  }

  button:active:not(:disabled) {
    transform: translateY(0);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }

  .badge {
    text-align: center;
    padding: 10px;
    font-size: 10px;
    color: rgba(99, 102, 241, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.15em;
    font-weight: 500;
    background: rgba(30, 41, 59, 0.5);
    border-top: 1px solid rgba(51, 65, 85, 0.3);
  }
</style>

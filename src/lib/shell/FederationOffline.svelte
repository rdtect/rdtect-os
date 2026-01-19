<script lang="ts">
  /**
   * FederationOffline Component
   *
   * Displays a friendly message when a federation remote is unavailable.
   * Shows the remote URL and provides a retry option.
   */

  interface Props {
    remoteUrl: string;
    error: string;
    appName?: string;
    appIcon?: string;
    onRetry?: () => void;
  }

  let { remoteUrl, error, appName = 'Remote App', appIcon = '🔌', onRetry }: Props = $props();

  // Extract the base URL for display
  const displayUrl = $derived(() => {
    try {
      const url = new URL(remoteUrl);
      return `${url.protocol}//${url.host}`;
    } catch {
      return remoteUrl;
    }
  });

  // Format error message to be more user-friendly
  const friendlyError = $derived(() => {
    if (error.includes('Timeout')) {
      return 'Connection timed out';
    }
    if (error.includes('Failed to load script')) {
      return 'Server is not responding';
    }
    if (error.includes('not available')) {
      return 'Server is offline';
    }
    return 'Unable to connect';
  });
</script>

<div class="federation-offline">
  <div class="offline-content">
    <!-- Icon and Status -->
    <div class="offline-icon-container">
      <span class="app-icon">{appIcon}</span>
      <span class="offline-badge">Offline</span>
    </div>

    <!-- Message -->
    <h3 class="offline-title">{appName}</h3>
    <p class="offline-message">{friendlyError()}</p>

    <!-- Server Info -->
    <div class="server-info">
      <span class="server-label">Remote server:</span>
      <code class="server-url">{displayUrl()}</code>
    </div>

    <!-- Instructions -->
    <div class="offline-instructions">
      <p>To use this app, make sure the remote server is running:</p>
      <code class="command-hint">cd plugins/{appName.toLowerCase().replace(/\s+/g, '-')} && bun run dev</code>
    </div>

    <!-- Retry Button -->
    {#if onRetry}
      <button class="retry-button" onclick={onRetry}>
        <svg class="retry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Retry Connection
      </button>
    {/if}

    <!-- Debug Info (collapsed) -->
    <details class="debug-details">
      <summary>Technical Details</summary>
      <pre class="debug-content">{error}</pre>
    </details>
  </div>
</div>

<style>
  .federation-offline {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 300px;
    padding: 2rem;
    background: linear-gradient(180deg,
      rgba(15, 23, 42, 0.95) 0%,
      rgba(30, 41, 59, 0.9) 100%
    );
    color: #94a3b8;
    text-align: center;
  }

  .offline-content {
    max-width: 400px;
    width: 100%;
  }

  .offline-icon-container {
    position: relative;
    display: inline-flex;
    margin-bottom: 1rem;
  }

  .app-icon {
    font-size: 4rem;
    filter: grayscale(70%) opacity(0.7);
    transition: filter 0.3s ease;
  }

  .offline-badge {
    position: absolute;
    bottom: -4px;
    right: -8px;
    padding: 0.25rem 0.5rem;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    border-radius: 0.375rem;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  }

  .offline-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #e2e8f0;
    margin: 0 0 0.5rem 0;
  }

  .offline-message {
    font-size: 0.95rem;
    color: #94a3b8;
    margin: 0 0 1.5rem 0;
  }

  .server-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(71, 85, 105, 0.4);
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }

  .server-label {
    font-size: 0.75rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .server-url {
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace;
    font-size: 0.85rem;
    color: #f97316;
    word-break: break-all;
  }

  .offline-instructions {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 0.5rem;
  }

  .offline-instructions p {
    font-size: 0.85rem;
    color: #94a3b8;
    margin: 0 0 0.75rem 0;
  }

  .command-hint {
    display: block;
    padding: 0.5rem 0.75rem;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace;
    font-size: 0.75rem;
    color: #a5b4fc;
    background: rgba(30, 41, 59, 0.8);
    border-radius: 0.375rem;
    word-break: break-all;
  }

  .retry-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: white;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  }

  .retry-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  .retry-button:active {
    transform: translateY(0);
  }

  .retry-icon {
    width: 1rem;
    height: 1rem;
  }

  .debug-details {
    margin-top: 1.5rem;
    text-align: left;
  }

  .debug-details summary {
    font-size: 0.75rem;
    color: #64748b;
    cursor: pointer;
    padding: 0.25rem 0;
    transition: color 0.2s ease;
  }

  .debug-details summary:hover {
    color: #94a3b8;
  }

  .debug-content {
    margin-top: 0.5rem;
    padding: 0.75rem;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace;
    font-size: 0.7rem;
    color: #64748b;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: 0.375rem;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 100px;
    overflow-y: auto;
  }
</style>

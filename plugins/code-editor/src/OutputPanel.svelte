<script lang="ts">
  import type { PyodideResult } from './pyodide';

  // Props
  interface Props {
    result: PyodideResult | null;
    isRunning?: boolean;
    onClear?: () => void;
  }

  let {
    result = null,
    isRunning = false,
    onClear
  }: Props = $props();

  /**
   * Format execution time
   */
  function formatTime(ms: number): string {
    if (ms < 1000) {
      return `${ms.toFixed(1)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  }
</script>

<div class="output-panel">
  <div class="output-header">
    <div class="header-left">
      <span class="title">Output</span>
      {#if result}
        <span class="status" class:success={result.success} class:error={!result.success}>
          {result.success ? 'Success' : 'Error'}
        </span>
        <span class="execution-time">
          {formatTime(result.executionTime)}
        </span>
      {/if}
    </div>
    <div class="header-right">
      {#if isRunning}
        <span class="running-indicator">
          <span class="spinner"></span>
          Running...
        </span>
      {/if}
      <button
        class="clear-btn"
        onclick={onClear}
        disabled={!result && !isRunning}
        title="Clear output"
      >
        Clear
      </button>
    </div>
  </div>

  <div class="output-content">
    {#if isRunning}
      <div class="running-message">
        <span class="spinner large"></span>
        <p>Executing code...</p>
      </div>
    {:else if result}
      {#if result.stdout}
        <div class="output-section">
          <div class="section-label">stdout:</div>
          <pre class="stdout">{result.stdout}</pre>
        </div>
      {/if}

      {#if result.stderr}
        <div class="output-section">
          <div class="section-label">stderr:</div>
          <pre class="stderr">{result.stderr}</pre>
        </div>
      {/if}

      {#if result.error}
        <div class="output-section">
          <div class="section-label error-label">Error:</div>
          <pre class="error">{result.error}</pre>
        </div>
      {/if}

      {#if result.result !== null && result.result !== undefined && !result.error}
        <div class="output-section">
          <div class="section-label">Return value:</div>
          <pre class="return-value">{String(result.result)}</pre>
        </div>
      {/if}

      {#if !result.stdout && !result.stderr && !result.error && (result.result === null || result.result === undefined)}
        <div class="empty-output">
          <p>No output</p>
        </div>
      {/if}
    {:else}
      <div class="empty-output">
        <p>Run your code to see the output here.</p>
        <p class="hint">Press Ctrl+Enter to run</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .output-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #1e1e1e;
    border-radius: 4px;
    overflow: hidden;
  }

  .output-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: #252526;
    border-bottom: 1px solid #3c3c3c;
    min-height: 40px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .title {
    font-weight: 600;
    color: #cccccc;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 500;
  }

  .status.success {
    background-color: rgba(0, 170, 0, 0.2);
    color: #4ec9b0;
  }

  .status.error {
    background-color: rgba(255, 0, 0, 0.2);
    color: #f14c4c;
  }

  .execution-time {
    font-size: 11px;
    color: #858585;
  }

  .running-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #569cd6;
  }

  .clear-btn {
    padding: 4px 12px;
    background-color: #3c3c3c;
    border: none;
    border-radius: 4px;
    color: #cccccc;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .clear-btn:hover:not(:disabled) {
    background-color: #4c4c4c;
  }

  .clear-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .output-content {
    flex: 1;
    overflow: auto;
    padding: 12px;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.5;
  }

  .output-section {
    margin-bottom: 12px;
  }

  .output-section:last-child {
    margin-bottom: 0;
  }

  .section-label {
    font-size: 11px;
    color: #858585;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .error-label {
    color: #f14c4c;
  }

  pre {
    margin: 0;
    padding: 8px;
    background-color: #252526;
    border-radius: 4px;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-x: auto;
  }

  .stdout {
    color: #d4d4d4;
  }

  .stderr {
    color: #f14c4c;
  }

  .error {
    color: #f14c4c;
    background-color: rgba(244, 76, 76, 0.1);
    border: 1px solid rgba(244, 76, 76, 0.3);
  }

  .return-value {
    color: #4ec9b0;
  }

  .empty-output {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #6a6a6a;
    text-align: center;
  }

  .empty-output p {
    margin: 4px 0;
  }

  .empty-output .hint {
    font-size: 12px;
    color: #505050;
  }

  .running-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    color: #569cd6;
  }

  .running-message p {
    margin: 0;
    font-size: 14px;
  }

  /* Spinner animation */
  .spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid currentColor;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 0.8s linear infinite;
  }

  .spinner.large {
    width: 24px;
    height: 24px;
    border-width: 3px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Scrollbar styling */
  .output-content::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  .output-content::-webkit-scrollbar-track {
    background: #1e1e1e;
  }

  .output-content::-webkit-scrollbar-thumb {
    background: #424242;
    border-radius: 5px;
  }

  .output-content::-webkit-scrollbar-thumb:hover {
    background: #4f4f4f;
  }
</style>

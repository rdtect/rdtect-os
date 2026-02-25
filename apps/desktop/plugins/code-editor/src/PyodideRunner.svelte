<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { initPyodide, runPython, isPyodideReady, type PyodideResult } from './pyodide';

  // Props
  interface Props {
    onReady?: () => void;
    onResult?: (result: PyodideResult) => void;
    onLoadingChange?: (loading: boolean) => void;
    onStatusChange?: (status: string) => void;
  }

  let {
    onReady,
    onResult,
    onLoadingChange,
    onStatusChange
  }: Props = $props();

  // State
  let isLoading = $state(true);
  let isRunning = $state(false);
  let loadStatus = $state('Initializing...');
  let error = $state<string | null>(null);

  // Track if component is mounted
  let isMounted = true;

  /**
   * Initialize Pyodide on mount
   */
  onMount(async () => {
    try {
      isLoading = true;
      error = null;
      onLoadingChange?.(true);

      await initPyodide((message) => {
        if (isMounted) {
          loadStatus = message;
          onStatusChange?.(message);
        }
      });

      if (isMounted) {
        isLoading = false;
        loadStatus = 'Ready';
        onLoadingChange?.(false);
        onStatusChange?.('Ready');
        onReady?.();
      }
    } catch (err) {
      if (isMounted) {
        error = err instanceof Error ? err.message : String(err);
        loadStatus = 'Failed to load';
        isLoading = false;
        onLoadingChange?.(false);
        onStatusChange?.('Failed to load Python runtime');
      }
    }
  });

  onDestroy(() => {
    isMounted = false;
  });

  /**
   * Execute Python code
   */
  export async function execute(code: string): Promise<PyodideResult | null> {
    if (!isPyodideReady()) {
      const result: PyodideResult = {
        success: false,
        stdout: '',
        stderr: '',
        result: null,
        error: 'Python runtime is not ready. Please wait for it to load.',
        executionTime: 0
      };
      onResult?.(result);
      return result;
    }

    if (isRunning) {
      return null;
    }

    isRunning = true;
    onLoadingChange?.(true);
    onStatusChange?.('Running...');

    try {
      const result = await runPython(code);

      if (isMounted) {
        isRunning = false;
        onLoadingChange?.(false);
        onStatusChange?.(result.success ? 'Completed' : 'Error');
        onResult?.(result);
      }

      return result;
    } catch (err) {
      const result: PyodideResult = {
        success: false,
        stdout: '',
        stderr: '',
        result: null,
        error: err instanceof Error ? err.message : String(err),
        executionTime: 0
      };

      if (isMounted) {
        isRunning = false;
        onLoadingChange?.(false);
        onStatusChange?.('Error');
        onResult?.(result);
      }

      return result;
    }
  }

  /**
   * Check if runner is ready
   */
  export function isReady(): boolean {
    return isPyodideReady() && !isLoading;
  }

  /**
   * Check if currently running code
   */
  export function getIsRunning(): boolean {
    return isRunning;
  }
</script>

<!-- Loading indicator for Pyodide initialization -->
{#if isLoading}
  <div class="loading-overlay">
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <div class="loading-text">{loadStatus}</div>
      <div class="loading-hint">First load may take a few seconds...</div>
    </div>
  </div>
{/if}

{#if error}
  <div class="error-overlay">
    <div class="error-content">
      <div class="error-icon">!</div>
      <div class="error-title">Failed to Load Python Runtime</div>
      <div class="error-message">{error}</div>
      <button class="retry-btn" onclick={() => window.location.reload()}>
        Reload Page
      </button>
    </div>
  </div>
{/if}

<style>
  .loading-overlay,
  .error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(30, 30, 30, 0.95);
    z-index: 100;
  }

  .loading-content,
  .error-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    text-align: center;
    padding: 24px;
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #3c3c3c;
    border-top-color: #569cd6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-text {
    font-size: 16px;
    color: #cccccc;
    font-weight: 500;
  }

  .loading-hint {
    font-size: 12px;
    color: #858585;
  }

  .error-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: rgba(244, 76, 76, 0.2);
    color: #f14c4c;
    font-size: 24px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .error-title {
    font-size: 18px;
    color: #f14c4c;
    font-weight: 600;
  }

  .error-message {
    font-size: 14px;
    color: #cccccc;
    max-width: 400px;
    word-wrap: break-word;
  }

  .retry-btn {
    padding: 8px 24px;
    background-color: #569cd6;
    border: none;
    border-radius: 4px;
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .retry-btn:hover {
    background-color: #4a8bc9;
  }
</style>

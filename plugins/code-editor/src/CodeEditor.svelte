<script lang="ts">
  import { onMount } from 'svelte';
  import Editor from './Editor.svelte';
  import OutputPanel from './OutputPanel.svelte';
  import PyodideRunner from './PyodideRunner.svelte';
  import type { PyodideResult } from './pyodide';

  // Props from window manager
  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  // File tab interface
  interface FileTab {
    id: string;
    name: string;
    code: string;
    language: 'python' | 'javascript';
    isDirty: boolean;
  }

  // State
  let tabs = $state<FileTab[]>([
    {
      id: 'file-1',
      name: 'main.py',
      code: `# Welcome to the Code Editor!
# Press Ctrl+Enter to run your Python code

print("Hello, World!")

# Try some calculations
for i in range(5):
    print(f"Number: {i}")

# Define a function
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(f"Factorial of 5: {factorial(5)}")
`,
      language: 'python',
      isDirty: false
    }
  ]);

  let activeTabId = $state('file-1');
  let result = $state<PyodideResult | null>(null);
  let isRunning = $state(false);
  let pyodideReady = $state(false);
  let pyodideStatus = $state('Loading...');

  // Runner component reference
  let pyodideRunner: PyodideRunner;

  // Get active tab
  const activeTab = $derived(tabs.find(t => t.id === activeTabId));

  // Counter for new file names
  let fileCounter = 2;

  /**
   * Create a new file tab
   */
  function createNewFile(): void {
    const id = `file-${Date.now()}`;
    const newTab: FileTab = {
      id,
      name: `untitled${fileCounter++}.py`,
      code: '# New Python file\n\n',
      language: 'python',
      isDirty: true
    };
    tabs = [...tabs, newTab];
    activeTabId = id;
  }

  /**
   * Close a file tab
   */
  function closeTab(id: string): void {
    if (tabs.length <= 1) {
      // Don't close the last tab
      return;
    }

    const index = tabs.findIndex(t => t.id === id);
    tabs = tabs.filter(t => t.id !== id);

    // If closing active tab, switch to another
    if (activeTabId === id) {
      const newIndex = Math.min(index, tabs.length - 1);
      activeTabId = tabs[newIndex].id;
    }
  }

  /**
   * Handle code change in editor
   */
  function handleCodeChange(code: string): void {
    const tabIndex = tabs.findIndex(t => t.id === activeTabId);
    if (tabIndex >= 0) {
      tabs[tabIndex].code = code;
      tabs[tabIndex].isDirty = true;
    }
  }

  /**
   * Run the current code
   */
  async function runCode(): Promise<void> {
    if (!pyodideReady || isRunning || !activeTab) {
      return;
    }

    if (activeTab.language === 'python') {
      isRunning = true;
      await pyodideRunner.execute(activeTab.code);
      isRunning = false;
    } else {
      // JavaScript execution (simple eval - be careful!)
      const startTime = performance.now();
      let stdout = '';
      let stderr = '';
      let error: string | undefined;

      // Capture console.log
      const originalLog = console.log;
      const originalError = console.error;

      console.log = (...args) => {
        stdout += args.map(a => String(a)).join(' ') + '\n';
      };
      console.error = (...args) => {
        stderr += args.map(a => String(a)).join(' ') + '\n';
      };

      try {
        // eslint-disable-next-line no-eval
        const evalResult = eval(activeTab.code);
        result = {
          success: true,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          result: evalResult,
          executionTime: performance.now() - startTime
        };
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
        result = {
          success: false,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          result: null,
          error,
          executionTime: performance.now() - startTime
        };
      } finally {
        console.log = originalLog;
        console.error = originalError;
      }
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  function handleKeyDown(event: KeyboardEvent): void {
    // Ctrl+Enter to run
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      runCode();
    }
    // Ctrl+S to save (mark as not dirty)
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      const tabIndex = tabs.findIndex(t => t.id === activeTabId);
      if (tabIndex >= 0) {
        tabs[tabIndex].isDirty = false;
      }
    }
    // Ctrl+N for new file
    if (event.ctrlKey && event.key === 'n') {
      event.preventDefault();
      createNewFile();
    }
  }

  /**
   * Clear output
   */
  function clearOutput(): void {
    result = null;
  }

  /**
   * Change language for current tab
   */
  function changeLanguage(lang: 'python' | 'javascript'): void {
    const tabIndex = tabs.findIndex(t => t.id === activeTabId);
    if (tabIndex >= 0) {
      tabs[tabIndex].language = lang;
      // Update file extension
      const baseName = tabs[tabIndex].name.replace(/\.(py|js)$/, '');
      tabs[tabIndex].name = baseName + (lang === 'python' ? '.py' : '.js');
    }
  }

  onMount(() => {
    // Focus handling is done in Editor component
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="code-editor" onkeydown={handleKeyDown}>
  <!-- Toolbar -->
  <div class="toolbar">
    <div class="toolbar-left">
      <button
        class="toolbar-btn"
        onclick={createNewFile}
        title="New File (Ctrl+N)"
      >
        <span class="icon">+</span>
        New
      </button>

      <select
        class="language-select"
        value={activeTab?.language ?? 'python'}
        onchange={(e) => changeLanguage((e.target as HTMLSelectElement).value as 'python' | 'javascript')}
      >
        <option value="python">Python</option>
        <option value="javascript">JavaScript</option>
      </select>
    </div>

    <div class="toolbar-center">
      <button
        class="run-btn"
        onclick={runCode}
        disabled={!pyodideReady && activeTab?.language === 'python'}
        title="Run Code (Ctrl+Enter)"
      >
        {#if isRunning}
          <span class="spinner"></span>
          Running...
        {:else}
          <span class="play-icon">&#9654;</span>
          Run
        {/if}
      </button>
    </div>

    <div class="toolbar-right">
      <span class="status-indicator" class:ready={pyodideReady}>
        {pyodideStatus}
      </span>
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs-bar">
    {#each tabs as tab (tab.id)}
      <button
        class="tab"
        class:active={tab.id === activeTabId}
        onclick={() => activeTabId = tab.id}
      >
        <span class="tab-icon">
          {tab.language === 'python' ? '&#128013;' : '&#128312;'}
        </span>
        <span class="tab-name">{tab.name}</span>
        {#if tab.isDirty}
          <span class="dirty-indicator">*</span>
        {/if}
        {#if tabs.length > 1}
          <button
            class="tab-close"
            onclick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
            title="Close"
          >
            &times;
          </button>
        {/if}
      </button>
    {/each}
  </div>

  <!-- Main content area -->
  <div class="content">
    <!-- Editor pane -->
    <div class="editor-pane">
      {#if activeTab}
        <Editor
          bind:code={activeTab.code}
          language={activeTab.language}
          onCodeChange={handleCodeChange}
        />
      {/if}
    </div>

    <!-- Output pane -->
    <div class="output-pane">
      <OutputPanel
        {result}
        {isRunning}
        onClear={clearOutput}
      />
    </div>
  </div>

  <!-- Pyodide Runner (handles loading state) -->
  <PyodideRunner
    bind:this={pyodideRunner}
    onReady={() => pyodideReady = true}
    onResult={(r) => result = r}
    onStatusChange={(status) => pyodideStatus = status}
  />
</div>

<style>
  .code-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #0f172a;
    color: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    position: relative;
    overflow: hidden;
  }

  /* Toolbar */
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background-color: #1e293b;
    border-bottom: 1px solid #334155;
    gap: 12px;
  }

  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background-color: #334155;
    border: none;
    border-radius: 4px;
    color: #f8fafc;
    font-size: 13px;
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .toolbar-btn:hover {
    background-color: #475569;
  }

  .toolbar-btn .icon {
    font-size: 16px;
    font-weight: bold;
  }

  .language-select {
    padding: 6px 8px;
    background-color: #334155;
    border: 1px solid #475569;
    border-radius: 4px;
    color: #f8fafc;
    font-size: 13px;
    cursor: pointer;
  }

  .language-select:focus {
    outline: none;
    border-color: #6366f1;
  }

  .run-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 20px;
    background-color: #6366f1;
    border: none;
    border-radius: 4px;
    color: white;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .run-btn:hover:not(:disabled) {
    background-color: #818cf8;
  }

  .run-btn:disabled {
    background-color: #475569;
    cursor: not-allowed;
  }

  .play-icon {
    font-size: 10px;
  }

  .spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid #ffffff40;
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .status-indicator {
    font-size: 12px;
    color: #94a3b8;
    padding: 4px 8px;
    background-color: #334155;
    border-radius: 4px;
  }

  .status-indicator.ready {
    color: #4ec9b0;
    background-color: rgba(78, 201, 176, 0.1);
  }

  /* Tabs */
  .tabs-bar {
    display: flex;
    background-color: #1e293b;
    border-bottom: 1px solid #334155;
    overflow-x: auto;
    min-height: 35px;
  }

  .tabs-bar::-webkit-scrollbar {
    height: 4px;
  }

  .tabs-bar::-webkit-scrollbar-thumb {
    background: #475569;
    border-radius: 2px;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background-color: transparent;
    border: none;
    border-right: 1px solid #334155;
    color: #94a3b8;
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 0.15s;
  }

  .tab:hover {
    background-color: #1e293b;
  }

  .tab.active {
    background-color: #0f172a;
    color: #ffffff;
    border-bottom: 2px solid #6366f1;
  }

  .tab-icon {
    font-size: 14px;
  }

  .tab-name {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dirty-indicator {
    color: #f14c4c;
    font-size: 16px;
  }

  .tab-close {
    padding: 0 4px;
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 16px;
    cursor: pointer;
    border-radius: 4px;
    line-height: 1;
  }

  .tab-close:hover {
    color: #ffffff;
    background-color: #475569;
  }

  /* Content area */
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .editor-pane {
    flex: 1;
    min-height: 200px;
    overflow: hidden;
  }

  .output-pane {
    height: 200px;
    border-top: 1px solid #334155;
    overflow: hidden;
  }

  /* Make editor/output resizable in the future */
  @media (min-height: 500px) {
    .output-pane {
      height: 220px;
    }
  }
</style>

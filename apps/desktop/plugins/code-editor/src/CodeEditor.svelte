<script lang="ts">
  import { onMount } from 'svelte';
  import Editor from './Editor.svelte';
  import OutputPanel from './OutputPanel.svelte';
  import PyodideRunner from './PyodideRunner.svelte';
  import type { PyodideResult } from './pyodide';
  import { vfs } from '$lib/core/vfs';

  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  // File tab interface
  interface FileTab {
    id: string;
    name: string;
    code: string;
    language: 'python' | 'javascript' | 'typescript' | 'svelte' | 'css' | 'json' | 'markdown' | 'html';
    isDirty: boolean;
    vfsPath?: string;
  }

  // VFS tree node
  interface TreeNode {
    name: string;
    path: string;
    isDir: boolean;
    children?: TreeNode[];
    expanded?: boolean;
  }

  // Language detection
  const EXT_LANG_MAP: Record<string, FileTab['language']> = {
    '.py': 'python',
    '.js': 'javascript',
    '.ts': 'typescript',
    '.svelte': 'svelte',
    '.css': 'css',
    '.json': 'json',
    '.md': 'markdown',
    '.html': 'html',
    '.htm': 'html',
  };

  function detectLanguage(filename: string): FileTab['language'] {
    const ext = '.' + filename.split('.').pop()?.toLowerCase();
    return EXT_LANG_MAP[ext] || 'javascript';
  }

  function getRunnable(lang: FileTab['language']): boolean {
    return lang === 'python' || lang === 'javascript';
  }

  // State
  let tabs = $state<FileTab[]>([
    {
      id: 'file-1',
      name: 'main.py',
      code: `# Welcome to the Code Editor!\n# Press Ctrl+Enter to run your Python code\n\nprint("Hello, World!")\n\nfor i in range(5):\n    print(f"Number: {i}")\n\ndef factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint(f"Factorial of 5: {factorial(5)}")\n`,
      language: 'python',
      isDirty: false
    }
  ]);

  let activeTabId = $state('file-1');
  let result = $state<PyodideResult | null>(null);
  let isRunning = $state(false);
  let pyodideReady = $state(false);
  let pyodideStatus = $state('Loading...');
  let pyodideRunner: PyodideRunner;

  // File tree state
  let showFileTree = $state(true);
  let fileTree = $state<TreeNode[]>([]);
  let treeLoading = $state(false);

  // Find/replace state
  let showFind = $state(false);
  let showReplace = $state(false);
  let findQuery = $state('');
  let replaceQuery = $state('');
  let findMatchCount = $state(0);

  // Tab size
  let tabSize = $state(4);

  // Derived
  const activeTab = $derived(tabs.find(t => t.id === activeTabId));
  let fileCounter = 2;

  // === File Tree ===
  async function loadFileTree(path = '/home/user') {
    treeLoading = true;
    try {
      const entries = await vfs.readdir(path);
      const nodes: TreeNode[] = [];
      for (const entry of entries) {
        const fullPath = path === '/' ? `/${entry.name}` : `${path}/${entry.name}`;
        nodes.push({
          name: entry.name,
          path: fullPath,
          isDir: entry.type === 'directory',
          expanded: false,
        });
      }
      nodes.sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });
      fileTree = nodes;
    } catch {
      fileTree = [];
    }
    treeLoading = false;
  }

  async function toggleTreeNode(node: TreeNode) {
    if (!node.isDir) {
      await openFileFromTree(node);
      return;
    }

    node.expanded = !node.expanded;
    if (node.expanded && !node.children) {
      try {
        const entries = await vfs.readdir(node.path);
        node.children = entries.map(e => ({
          name: e.name,
          path: node.path === '/' ? `/${e.name}` : `${node.path}/${e.name}`,
          isDir: e.type === 'directory',
          expanded: false,
        })).sort((a, b) => {
          if (a.isDir && !b.isDir) return -1;
          if (!a.isDir && b.isDir) return 1;
          return a.name.localeCompare(b.name);
        });
      } catch {
        node.children = [];
      }
    }
    fileTree = [...fileTree]; // trigger reactivity
  }

  async function openFileFromTree(node: TreeNode) {
    // Check if already open
    const existing = tabs.find(t => t.vfsPath === node.path);
    if (existing) {
      activeTabId = existing.id;
      return;
    }

    try {
      const content = await vfs.readFile(node.path);
      const text = typeof content === 'string' ? content : new TextDecoder().decode(content as ArrayBuffer);
      const lang = detectLanguage(node.name);
      const newTab: FileTab = {
        id: `file-${Date.now()}`,
        name: node.name,
        code: text,
        language: lang,
        isDirty: false,
        vfsPath: node.path,
      };
      tabs = [...tabs, newTab];
      activeTabId = newTab.id;
    } catch {
      // File couldn't be read
    }
  }

  // === File Operations ===
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

  function closeTab(id: string): void {
    if (tabs.length <= 1) return;
    const index = tabs.findIndex(t => t.id === id);
    tabs = tabs.filter(t => t.id !== id);
    if (activeTabId === id) {
      const newIndex = Math.min(index, tabs.length - 1);
      activeTabId = tabs[newIndex].id;
    }
  }

  function handleCodeChange(code: string): void {
    const tabIndex = tabs.findIndex(t => t.id === activeTabId);
    if (tabIndex >= 0) {
      tabs[tabIndex].code = code;
      tabs[tabIndex].isDirty = true;
    }
  }

  // === Save to VFS ===
  async function saveCurrentFile(): Promise<void> {
    const tabIndex = tabs.findIndex(t => t.id === activeTabId);
    if (tabIndex < 0) return;
    const tab = tabs[tabIndex];

    if (tab.vfsPath) {
      try {
        await vfs.writeFile(tab.vfsPath, tab.code);
        tabs[tabIndex].isDirty = false;
      } catch { /* save failed */ }
    } else {
      // No VFS path — just mark as saved
      tabs[tabIndex].isDirty = false;
    }
  }

  // === Find/Replace ===
  function handleFind() {
    if (!activeTab || !findQuery) {
      findMatchCount = 0;
      return;
    }
    const regex = new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = activeTab.code.match(regex);
    findMatchCount = matches ? matches.length : 0;
  }

  function handleReplace() {
    if (!activeTab || !findQuery) return;
    const tabIndex = tabs.findIndex(t => t.id === activeTabId);
    if (tabIndex < 0) return;
    const regex = new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    tabs[tabIndex].code = tabs[tabIndex].code.replace(regex, replaceQuery);
    tabs[tabIndex].isDirty = true;
    handleFind();
  }

  function handleReplaceAll() {
    if (!activeTab || !findQuery) return;
    const tabIndex = tabs.findIndex(t => t.id === activeTabId);
    if (tabIndex < 0) return;
    const regex = new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    tabs[tabIndex].code = tabs[tabIndex].code.replace(regex, replaceQuery);
    tabs[tabIndex].isDirty = true;
    handleFind();
  }

  // === Run Code ===
  async function runCode(): Promise<void> {
    if (!pyodideReady || isRunning || !activeTab) return;
    if (!getRunnable(activeTab.language)) return;

    if (activeTab.language === 'python') {
      isRunning = true;
      await pyodideRunner.execute(activeTab.code);
      isRunning = false;
    } else {
      const startTime = performance.now();
      let stdout = '';
      let stderr = '';

      const originalLog = console.log;
      const originalError = console.error;
      console.log = (...args) => { stdout += args.map(a => String(a)).join(' ') + '\n'; };
      console.error = (...args) => { stderr += args.map(a => String(a)).join(' ') + '\n'; };

      try {
        const evalResult = eval(activeTab.code);
        result = { success: true, stdout: stdout.trim(), stderr: stderr.trim(), result: evalResult, executionTime: performance.now() - startTime };
      } catch (e) {
        result = { success: false, stdout: stdout.trim(), stderr: stderr.trim(), result: null, error: e instanceof Error ? e.message : String(e), executionTime: performance.now() - startTime };
      } finally {
        console.log = originalLog;
        console.error = originalError;
      }
    }
  }

  // === Language Change ===
  function changeLanguage(lang: FileTab['language']): void {
    const tabIndex = tabs.findIndex(t => t.id === activeTabId);
    if (tabIndex >= 0) {
      tabs[tabIndex].language = lang;
      const extMap: Record<string, string> = { python: '.py', javascript: '.js', typescript: '.ts', svelte: '.svelte', css: '.css', json: '.json', markdown: '.md', html: '.html' };
      const baseName = tabs[tabIndex].name.replace(/\.\w+$/, '');
      tabs[tabIndex].name = baseName + (extMap[lang] || '.txt');
    }
  }

  // === Keyboard Shortcuts ===
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      runCode();
    }
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      saveCurrentFile();
    }
    if (event.ctrlKey && event.key === 'n') {
      event.preventDefault();
      createNewFile();
    }
    if (event.ctrlKey && event.key === 'f') {
      event.preventDefault();
      showFind = true;
      showReplace = false;
    }
    if (event.ctrlKey && event.key === 'h') {
      event.preventDefault();
      showFind = true;
      showReplace = true;
    }
    if (event.key === 'Escape') {
      showFind = false;
      showReplace = false;
    }
    if (event.ctrlKey && event.key === 'b') {
      event.preventDefault();
      showFileTree = !showFileTree;
    }
  }

  // React to find query changes
  $effect(() => {
    findQuery;
    handleFind();
  });

  function clearOutput(): void { result = null; }

  // File tree icon
  function getFileIcon(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase();
    const icons: Record<string, string> = {
      py: '🐍', js: '📜', ts: '🔷', svelte: '🔥', css: '🎨',
      json: '📋', md: '📝', html: '🌐', txt: '📄'
    };
    return icons[ext || ''] || '📄';
  }

  onMount(() => {
    loadFileTree();
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="code-editor" onkeydown={handleKeyDown}>
  <!-- File Tree Sidebar -->
  {#if showFileTree}
    <aside class="file-tree">
      <div class="tree-header">
        <span class="tree-title">Explorer</span>
        <button class="tree-btn" onclick={() => showFileTree = false} title="Close (Ctrl+B)">&times;</button>
      </div>
      <div class="tree-content">
        {#if treeLoading}
          <div class="tree-loading"><span class="spinner spinner-sm"></span> Loading...</div>
        {:else if fileTree.length === 0}
          <div class="tree-empty">No files</div>
        {:else}
          {#each fileTree as node (node.path)}
            {@render treeNodeItem(node, 0)}
          {/each}
        {/if}
      </div>
    </aside>
  {/if}

  <!-- Main Editor Area -->
  <div class="editor-main">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        {#if !showFileTree}
          <button class="toolbar-btn" onclick={() => showFileTree = true} title="Explorer (Ctrl+B)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
            </svg>
          </button>
        {/if}
        <button class="toolbar-btn" onclick={createNewFile} title="New File (Ctrl+N)">
          <span class="icon">+</span> New
        </button>
        <select
          class="language-select"
          value={activeTab?.language ?? 'python'}
          onchange={(e) => changeLanguage((e.target as HTMLSelectElement).value as FileTab['language'])}
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="svelte">Svelte</option>
          <option value="css">CSS</option>
          <option value="json">JSON</option>
          <option value="markdown">Markdown</option>
          <option value="html">HTML</option>
        </select>
        <div class="tab-size-toggle">
          <span class="tab-size-label">Tab:</span>
          <button class="tab-size-btn" class:active={tabSize === 2} onclick={() => tabSize = 2}>2</button>
          <button class="tab-size-btn" class:active={tabSize === 4} onclick={() => tabSize = 4}>4</button>
        </div>
      </div>
      <div class="toolbar-center">
        <button
          class="run-btn"
          onclick={runCode}
          disabled={!pyodideReady && activeTab?.language === 'python'}
          title="Run Code (Ctrl+Enter)"
        >
          {#if isRunning}
            <span class="spinner spinner-sm"></span> Running...
          {:else}
            <span class="play-icon">&#9654;</span> Run
          {/if}
        </button>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-btn" onclick={() => { showFind = !showFind; showReplace = false; }} title="Find (Ctrl+F)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </button>
        <span class="status-indicator" class:ready={pyodideReady}>{pyodideStatus}</span>
      </div>
    </div>

    <!-- Find/Replace Bar -->
    {#if showFind}
      <div class="find-bar">
        <div class="find-row">
          <input
            type="text"
            class="find-input"
            bind:value={findQuery}
            placeholder="Find..."
            autofocus
          />
          <span class="find-count">{findMatchCount} match{findMatchCount !== 1 ? 'es' : ''}</span>
          <button class="find-close" onclick={() => { showFind = false; showReplace = false; }}>&times;</button>
        </div>
        {#if showReplace}
          <div class="find-row">
            <input
              type="text"
              class="find-input"
              bind:value={replaceQuery}
              placeholder="Replace..."
            />
            <button class="find-action" onclick={handleReplace} title="Replace">Replace</button>
            <button class="find-action" onclick={handleReplaceAll} title="Replace All">All</button>
          </div>
        {:else}
          <button class="find-toggle" onclick={() => showReplace = true}>+ Replace (Ctrl+H)</button>
        {/if}
      </div>
    {/if}

    <!-- Tabs -->
    <div class="tabs-bar">
      {#each tabs as tab (tab.id)}
        <button
          class="tab"
          class:active={tab.id === activeTabId}
          onclick={() => activeTabId = tab.id}
        >
          <span class="tab-icon">{getFileIcon(tab.name)}</span>
          <span class="tab-name">{tab.name}</span>
          {#if tab.isDirty}
            <span class="dirty-indicator" title="Unsaved changes">●</span>
          {/if}
          {#if tabs.length > 1}
            <button
              class="tab-close"
              onclick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
              title="Close"
            >&times;</button>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Content -->
    <div class="content">
      <div class="editor-pane">
        {#if activeTab}
          <Editor
            bind:code={activeTab.code}
            language={activeTab.language === 'python' ? 'python' : 'javascript'}
            onCodeChange={handleCodeChange}
          />
        {/if}
      </div>
      <div class="output-pane">
        <OutputPanel {result} {isRunning} onClear={clearOutput} />
      </div>
    </div>
  </div>

  <PyodideRunner
    bind:this={pyodideRunner}
    onReady={() => pyodideReady = true}
    onResult={(r) => result = r}
    onStatusChange={(status) => pyodideStatus = status}
  />
</div>

{#snippet treeNodeItem(node: TreeNode, depth: number)}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="tree-node"
    class:active={tabs.some(t => t.vfsPath === node.path && t.id === activeTabId)}
    style="padding-left: {12 + depth * 16}px"
    onclick={() => toggleTreeNode(node)}
  >
    {#if node.isDir}
      <span class="tree-arrow" class:expanded={node.expanded}>▸</span>
      <span class="tree-icon">📁</span>
    {:else}
      <span class="tree-arrow-space"></span>
      <span class="tree-icon">{getFileIcon(node.name)}</span>
    {/if}
    <span class="tree-name" class:dir={node.isDir}>{node.name}</span>
  </div>
  {#if node.isDir && node.expanded && node.children}
    {#each node.children as child (child.path)}
      {@render treeNodeItem(child, depth + 1)}
    {/each}
  {/if}
{/snippet}

<style>
  .code-editor {
    display: flex;
    height: 100%;
    background-color: #0f172a;
    color: #f8fafc;
    font-family: var(--desktop-font-sans);
    position: relative;
    overflow: hidden;
  }

  /* === File Tree === */
  .file-tree {
    width: 220px;
    min-width: 220px;
    display: flex;
    flex-direction: column;
    background: #1e293b;
    border-right: 1px solid #334155;
  }

  .tree-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-bottom: 1px solid #334155;
  }

  .tree-title {
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94a3b8;
  }

  .tree-btn {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 16px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
  }

  .tree-btn:hover { color: #f8fafc; background: rgba(99, 102, 241, 0.15); }

  .tree-content {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
  }

  .tree-loading, .tree-empty {
    padding: 20px 12px;
    font-size: var(--text-sm);
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tree-node {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: var(--text-sm);
    color: #e2e8f0;
    transition: background var(--transition-fast);
    min-height: 28px;
  }

  .tree-node:hover { background: rgba(99, 102, 241, 0.1); }
  .tree-node.active { background: rgba(99, 102, 241, 0.15); }

  .tree-arrow {
    font-size: 10px;
    color: #64748b;
    width: 14px;
    text-align: center;
    transition: transform var(--transition-fast);
    flex-shrink: 0;
  }

  .tree-arrow.expanded { transform: rotate(90deg); }
  .tree-arrow-space { width: 14px; flex-shrink: 0; }

  .tree-icon { font-size: 13px; flex-shrink: 0; }
  .tree-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tree-name.dir { color: #38bdf8; }

  /* === Main Editor === */
  .editor-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
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
    flex-shrink: 0;
  }

  .toolbar-left, .toolbar-center, .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    min-height: 36px;
    background-color: #334155;
    border: none;
    border-radius: var(--radius-sm);
    color: #f8fafc;
    font-size: 13px;
    cursor: pointer;
    transition: background-color var(--transition-fast);
  }

  .toolbar-btn:hover { background-color: #475569; }
  .toolbar-btn .icon { font-size: 16px; font-weight: bold; }

  .language-select {
    padding: 6px 8px;
    background-color: #334155;
    border: 1px solid #475569;
    border-radius: var(--radius-sm);
    color: #f8fafc;
    font-size: 13px;
    cursor: pointer;
  }

  .language-select:focus { outline: none; border-color: #6366f1; }

  .tab-size-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .tab-size-label {
    font-size: var(--text-xs);
    color: #94a3b8;
  }

  .tab-size-btn {
    padding: 2px 8px;
    background: #334155;
    border: 1px solid #475569;
    border-radius: var(--radius-sm);
    color: #94a3b8;
    font-size: var(--text-xs);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .tab-size-btn.active {
    background: rgba(99, 102, 241, 0.3);
    border-color: #6366f1;
    color: #a5b4fc;
  }

  .run-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 20px;
    min-height: 36px;
    background-color: #6366f1;
    border: none;
    border-radius: var(--radius-sm);
    color: white;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color var(--transition-fast);
  }

  .run-btn:hover:not(:disabled) { background-color: #818cf8; }
  .run-btn:disabled { background-color: #475569; cursor: not-allowed; }
  .play-icon { font-size: 10px; }

  .status-indicator {
    font-size: 12px;
    color: #94a3b8;
    padding: 4px 8px;
    background-color: #334155;
    border-radius: var(--radius-sm);
  }

  .status-indicator.ready { color: #22c55e; background-color: rgba(34, 197, 94, 0.1); }

  /* === Find Bar === */
  .find-bar {
    background: #1e293b;
    border-bottom: 1px solid #334155;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
  }

  .find-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .find-input {
    flex: 1;
    padding: 6px 10px;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid #475569;
    border-radius: var(--radius-sm);
    color: #f8fafc;
    font-size: var(--text-sm);
    outline: none;
  }

  .find-input:focus { border-color: #6366f1; }

  .find-count {
    font-size: var(--text-xs);
    color: #94a3b8;
    white-space: nowrap;
  }

  .find-close, .find-action {
    background: none;
    border: 1px solid #475569;
    border-radius: var(--radius-sm);
    color: #94a3b8;
    font-size: var(--text-sm);
    cursor: pointer;
    padding: 4px 10px;
    white-space: nowrap;
    transition: all var(--transition-fast);
  }

  .find-close:hover, .find-action:hover {
    background: rgba(99, 102, 241, 0.15);
    border-color: #6366f1;
    color: #a5b4fc;
  }

  .find-toggle {
    background: none;
    border: none;
    color: #64748b;
    font-size: var(--text-xs);
    cursor: pointer;
    padding: 2px 0;
    text-align: left;
  }

  .find-toggle:hover { color: #a5b4fc; }

  /* === Tabs === */
  .tabs-bar {
    display: flex;
    background-color: #1e293b;
    border-bottom: 1px solid #334155;
    overflow-x: auto;
    min-height: 35px;
    flex-shrink: 0;
  }

  .tabs-bar::-webkit-scrollbar { height: 4px; }
  .tabs-bar::-webkit-scrollbar-thumb { background: #475569; border-radius: 2px; }

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
    transition: background-color var(--transition-fast);
  }

  .tab:hover { background-color: #1e293b; }

  .tab.active {
    background-color: #0f172a;
    color: #ffffff;
    border-bottom: 2px solid #6366f1;
  }

  .tab-icon { font-size: 14px; }
  .tab-name { max-width: 150px; overflow: hidden; text-overflow: ellipsis; }

  .dirty-indicator {
    color: #f59e0b;
    font-size: 10px;
    margin-left: 2px;
  }

  .tab-close {
    padding: 0 4px;
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 16px;
    cursor: pointer;
    border-radius: var(--radius-sm);
    line-height: 1;
  }

  .tab-close:hover { color: #ffffff; background-color: #475569; }

  /* Content */
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .editor-pane { flex: 1; min-height: 200px; overflow: hidden; }
  .output-pane { height: 200px; border-top: 1px solid #334155; overflow: hidden; }

  @media (min-height: 500px) { .output-pane { height: 220px; } }

  /* Shared spinner */
  .spinner-sm { width: 14px; height: 14px; }

  @keyframes spin { to { transform: rotate(360deg); } }
</style>

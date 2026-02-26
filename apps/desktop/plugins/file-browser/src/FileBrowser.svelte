<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { vfs } from '$lib/core/vfs';
  import { eventBus } from '$lib/core/event-bus';
  import type { FileStat } from '$lib/core/vfs';

  // Props from window manager
  interface Props {
    windowId?: string;
    initialPath?: string;
  }
  let { windowId, initialPath = '/home/user' }: Props = $props();

  // === STATE ===
  let currentPath = $state(initialPath);
  let files = $state<FileStat[]>([]);
  let selectedFiles = $state<Set<string>>(new Set());
  let viewMode = $state<'grid' | 'list'>('grid');
  let sortBy = $state<'name' | 'size' | 'date' | 'type'>('name');
  let sortAsc = $state(true);
  let searchQuery = $state('');
  let isLoading = $state(true);
  let error = $state<string | null>(null);

  // Context menu state
  let contextMenu = $state<{
    visible: boolean;
    x: number;
    y: number;
    type: 'file' | 'background';
    targetPath?: string;
  }>({ visible: false, x: 0, y: 0, type: 'background' });

  // Clipboard state
  let clipboard = $state<{
    operation: 'copy' | 'cut' | null;
    paths: string[];
  }>({ operation: null, paths: [] });

  // Rename state
  let renaming = $state<{ path: string; name: string } | null>(null);

  // New item state
  let creating = $state<{ type: 'file' | 'folder'; name: string } | null>(null);

  // Path history for navigation
  let pathHistory = $state<string[]>([]);
  let pathHistoryIndex = $state(-1);

  // Sidebar locations
  const sidebarLocations = [
    { name: 'Home', path: '/home/user', icon: 'home' },
    { name: 'Desktop', path: '/home/user/Desktop', icon: 'desktop' },
    { name: 'Documents', path: '/home/user/Documents', icon: 'folder' },
    { name: 'Downloads', path: '/home/user/Downloads', icon: 'download' },
    { name: 'Pictures', path: '/home/user/Pictures', icon: 'image' },
  ];

  // File type icons mapping
  const fileIcons: Record<string, string> = {
    // Folders
    'directory': 'folder',
    // Documents
    '.md': 'markdown',
    '.txt': 'text',
    '.pdf': 'pdf',
    '.doc': 'word',
    '.docx': 'word',
    // Code
    '.js': 'javascript',
    '.ts': 'typescript',
    '.py': 'python',
    '.html': 'html',
    '.css': 'css',
    '.json': 'json',
    '.svelte': 'svelte',
    // Images
    '.png': 'image',
    '.jpg': 'image',
    '.jpeg': 'image',
    '.gif': 'image',
    '.svg': 'image',
    '.webp': 'image',
    // Media
    '.mp3': 'audio',
    '.wav': 'audio',
    '.mp4': 'video',
    '.mkv': 'video',
    // Archives
    '.zip': 'archive',
    '.tar': 'archive',
    '.gz': 'archive',
    '.rar': 'archive',
    // Other
    '.excalidraw': 'drawing',
  };

  // === COMPUTED ===
  const breadcrumbs = $derived(() => {
    const parts = currentPath.split('/').filter(Boolean);
    const crumbs = [{ name: 'Root', path: '/' }];
    let accumulated = '';
    for (const part of parts) {
      accumulated += '/' + part;
      crumbs.push({ name: part, path: accumulated });
    }
    return crumbs;
  });

  const filteredFiles = $derived(() => {
    let result = [...files];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(query));
    }

    // Sort
    result.sort((a, b) => {
      // Directories first
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;

      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'size':
          cmp = a.size - b.size;
          break;
        case 'date':
          cmp = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
          break;
        case 'type':
          const extA = a.name.includes('.') ? a.name.split('.').pop() || '' : '';
          const extB = b.name.includes('.') ? b.name.split('.').pop() || '' : '';
          cmp = extA.localeCompare(extB);
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  });

  const canGoBack = $derived(pathHistoryIndex > 0);
  const canGoForward = $derived(pathHistoryIndex < pathHistory.length - 1);
  const canGoUp = $derived(currentPath !== '/');
  const hasClipboard = $derived(clipboard.operation !== null && clipboard.paths.length > 0);

  // === METHODS ===
  async function loadDirectory(path: string, addToHistory = true) {
    isLoading = true;
    error = null;
    selectedFiles = new Set();

    try {
      await vfs.init();
      const entries = await vfs.readdir(path);
      files = entries;
      currentPath = path;

      if (addToHistory) {
        // Truncate forward history and add new path
        pathHistory = [...pathHistory.slice(0, pathHistoryIndex + 1), path];
        pathHistoryIndex = pathHistory.length - 1;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load directory';
      files = [];
    } finally {
      isLoading = false;
    }
  }

  function navigateTo(path: string) {
    loadDirectory(path);
  }

  function goBack() {
    if (canGoBack) {
      pathHistoryIndex--;
      loadDirectory(pathHistory[pathHistoryIndex], false);
    }
  }

  function goForward() {
    if (canGoForward) {
      pathHistoryIndex++;
      loadDirectory(pathHistory[pathHistoryIndex], false);
    }
  }

  function goUp() {
    if (canGoUp) {
      const parts = currentPath.split('/').filter(Boolean);
      parts.pop();
      const parentPath = parts.length === 0 ? '/' : '/' + parts.join('/');
      navigateTo(parentPath);
    }
  }

  function getFileIcon(file: FileStat): string {
    if (file.type === 'directory') return 'folder';
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    return fileIcons[ext] || 'file';
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
  }

  function formatDate(date: Date): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    }
  }

  function handleFileClick(file: FileStat, event: MouseEvent) {
    if (event.ctrlKey || event.metaKey) {
      // Toggle selection
      const newSet = new Set(selectedFiles);
      if (newSet.has(file.path)) {
        newSet.delete(file.path);
      } else {
        newSet.add(file.path);
      }
      selectedFiles = newSet;
    } else if (event.shiftKey && selectedFiles.size > 0) {
      // Range selection
      const lastSelected = Array.from(selectedFiles).pop();
      const currentIndex = filteredFiles().findIndex(f => f.path === file.path);
      const lastIndex = filteredFiles().findIndex(f => f.path === lastSelected);
      const start = Math.min(currentIndex, lastIndex);
      const end = Math.max(currentIndex, lastIndex);
      const newSet = new Set(selectedFiles);
      for (let i = start; i <= end; i++) {
        newSet.add(filteredFiles()[i].path);
      }
      selectedFiles = newSet;
    } else {
      selectedFiles = new Set([file.path]);
    }
  }

  function handleFileDoubleClick(file: FileStat) {
    if (file.type === 'directory') {
      navigateTo(file.path);
    } else {
      // Open file with associated app
      const association = vfs.getAssociation(file.path);
      eventBus.emit('file:open', {
        path: file.path,
        appId: association?.appId,
        mimeType: association?.mimeType
      });
    }
  }

  function handleContextMenu(event: MouseEvent, file?: FileStat) {
    event.preventDefault();
    event.stopPropagation();

    if (file) {
      // File context menu
      if (!selectedFiles.has(file.path)) {
        selectedFiles = new Set([file.path]);
      }
      contextMenu = {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        type: 'file',
        targetPath: file.path
      };
    } else {
      // Background context menu
      selectedFiles = new Set();
      contextMenu = {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        type: 'background'
      };
    }
  }

  function closeContextMenu() {
    contextMenu = { ...contextMenu, visible: false };
  }

  async function handleOpen() {
    closeContextMenu();
    const paths = Array.from(selectedFiles);
    for (const path of paths) {
      const file = files.find(f => f.path === path);
      if (file) {
        handleFileDoubleClick(file);
      }
    }
  }

  function handleCopy() {
    closeContextMenu();
    clipboard = { operation: 'copy', paths: Array.from(selectedFiles) };
    eventBus.emit('file:operation', {
      operation: 'copy',
      paths: Array.from(selectedFiles)
    });
  }

  function handleCut() {
    closeContextMenu();
    clipboard = { operation: 'cut', paths: Array.from(selectedFiles) };
    eventBus.emit('file:operation', {
      operation: 'cut',
      paths: Array.from(selectedFiles)
    });
  }

  async function handlePaste() {
    closeContextMenu();
    if (!hasClipboard) return;

    try {
      for (const srcPath of clipboard.paths) {
        const fileName = srcPath.split('/').pop() || 'file';
        const destPath = currentPath + '/' + fileName;

        if (clipboard.operation === 'copy') {
          await vfs.cp(srcPath, destPath);
        } else if (clipboard.operation === 'cut') {
          await vfs.mv(srcPath, destPath);
        }
      }

      if (clipboard.operation === 'cut') {
        clipboard = { operation: null, paths: [] };
      }

      eventBus.emit('file:operation', {
        operation: 'paste',
        paths: clipboard.paths,
        destination: currentPath
      });

      await loadDirectory(currentPath, false);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Paste failed';
    }
  }

  async function handleDelete() {
    closeContextMenu();
    const paths = Array.from(selectedFiles);

    if (!confirm(`Delete ${paths.length} item(s)?`)) return;

    try {
      for (const path of paths) {
        const file = files.find(f => f.path === path);
        if (file?.type === 'directory') {
          await vfs.rmdir(path, true);
        } else {
          await vfs.rm(path);
        }
      }

      eventBus.emit('file:operation', {
        operation: 'delete',
        paths
      });

      selectedFiles = new Set();
      await loadDirectory(currentPath, false);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Delete failed';
    }
  }

  function startRename() {
    closeContextMenu();
    const path = Array.from(selectedFiles)[0];
    const file = files.find(f => f.path === path);
    if (file) {
      renaming = { path: file.path, name: file.name };
    }
  }

  async function finishRename() {
    if (!renaming) return;

    try {
      const oldPath = renaming.path;
      const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/')) || '/';
      const newPath = parentPath + '/' + renaming.name;

      if (oldPath !== newPath) {
        await vfs.mv(oldPath, newPath);
        eventBus.emit('file:operation', {
          operation: 'rename',
          paths: [oldPath],
          destination: newPath
        });
        await loadDirectory(currentPath, false);
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Rename failed';
    }

    renaming = null;
  }

  function cancelRename() {
    renaming = null;
  }

  function startCreateNew(type: 'file' | 'folder') {
    closeContextMenu();
    creating = { type, name: type === 'folder' ? 'New Folder' : 'New File.txt' };
  }

  async function finishCreate() {
    if (!creating) return;

    try {
      const newPath = currentPath + '/' + creating.name;

      if (creating.type === 'folder') {
        await vfs.mkdir(newPath);
      } else {
        await vfs.writeFile(newPath, '');
      }

      eventBus.emit('file:operation', {
        operation: 'create',
        paths: [newPath]
      });

      await loadDirectory(currentPath, false);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Create failed';
    }

    creating = null;
  }

  function cancelCreate() {
    creating = null;
  }

  function handleKeydown(event: KeyboardEvent) {
    // Close context menu on Escape
    if (event.key === 'Escape') {
      closeContextMenu();
      if (renaming) cancelRename();
      if (creating) cancelCreate();
      return;
    }

    // Keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'c':
          if (selectedFiles.size > 0) {
            event.preventDefault();
            handleCopy();
          }
          break;
        case 'x':
          if (selectedFiles.size > 0) {
            event.preventDefault();
            handleCut();
          }
          break;
        case 'v':
          if (hasClipboard) {
            event.preventDefault();
            handlePaste();
          }
          break;
        case 'a':
          event.preventDefault();
          selectedFiles = new Set(files.map(f => f.path));
          break;
        case 'n':
          event.preventDefault();
          if (event.shiftKey) {
            startCreateNew('folder');
          } else {
            startCreateNew('file');
          }
          break;
      }
    }

    if (event.key === 'Delete' && selectedFiles.size > 0) {
      event.preventDefault();
      handleDelete();
    }

    if (event.key === 'F2' && selectedFiles.size === 1) {
      event.preventDefault();
      startRename();
    }

    if (event.key === 'Enter' && selectedFiles.size > 0 && !renaming && !creating) {
      event.preventDefault();
      handleOpen();
    }

    if (event.key === 'Backspace' && !renaming && !creating) {
      event.preventDefault();
      goUp();
    }
  }

  // Handle clicks outside context menu
  function handleGlobalClick(event: MouseEvent) {
    if (contextMenu.visible) {
      closeContextMenu();
    }
  }

  // VFS watcher
  let unwatchVfs: (() => void) | null = null;

  onMount(() => {
    loadDirectory(currentPath);

    // Watch for VFS changes
    unwatchVfs = vfs.watch(currentPath, (event) => {
      // Reload directory on any change
      loadDirectory(currentPath, false);
    });

    // Global click handler for closing context menu
    document.addEventListener('click', handleGlobalClick);
  });

  onDestroy(() => {
    if (unwatchVfs) unwatchVfs();
    document.removeEventListener('click', handleGlobalClick);
  });
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="file-browser">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-section">
      <div class="sidebar-header">Favorites</div>
      {#each sidebarLocations as loc}
        <button
          class="sidebar-item"
          class:active={currentPath === loc.path}
          onclick={() => navigateTo(loc.path)}
        >
          <span class="sidebar-icon" data-icon={loc.icon}></span>
          <span class="sidebar-label">{loc.name}</span>
        </button>
      {/each}
    </div>
  </aside>

  <!-- Main content -->
  <div class="main">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-nav">
        <button
          class="toolbar-btn"
          disabled={!canGoBack}
          onclick={goBack}
          title="Back"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          disabled={!canGoForward}
          onclick={goForward}
          title="Forward"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          disabled={!canGoUp}
          onclick={goUp}
          title="Up"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 15l-6-6-6 6"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          onclick={() => loadDirectory(currentPath, false)}
          title="Refresh"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
        </button>
      </div>

      <!-- Breadcrumbs -->
      <div class="breadcrumbs">
        {#each breadcrumbs() as crumb, i}
          {#if i > 0}
            <span class="breadcrumb-sep">/</span>
          {/if}
          <button
            class="breadcrumb"
            class:active={i === breadcrumbs().length - 1}
            onclick={() => navigateTo(crumb.path)}
          >
            {crumb.name}
          </button>
        {/each}
      </div>

      <!-- Search -->
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          class="search-input"
          placeholder="Search files..."
          bind:value={searchQuery}
        />
      </div>

      <!-- View toggle -->
      <div class="view-toggle">
        <button
          class="toolbar-btn"
          class:active={viewMode === 'grid'}
          onclick={() => viewMode = 'grid'}
          title="Grid view"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          class:active={viewMode === 'list'}
          onclick={() => viewMode = 'list'}
          title="List view"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="4" width="18" height="3" rx="1"/>
            <rect x="3" y="10.5" width="18" height="3" rx="1"/>
            <rect x="3" y="17" width="18" height="3" rx="1"/>
          </svg>
        </button>
      </div>

      <!-- Actions -->
      <div class="toolbar-actions">
        <button
          class="toolbar-btn"
          onclick={() => startCreateNew('folder')}
          title="New folder"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z"/>
            <line x1="12" y1="11" x2="12" y2="17"/>
            <line x1="9" y1="14" x2="15" y2="14"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          onclick={() => startCreateNew('file')}
          title="New file"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- List header (only in list view) -->
    {#if viewMode === 'list'}
      <div class="list-header">
        <button class="list-header-col name" onclick={() => { if (sortBy === 'name') sortAsc = !sortAsc; else { sortBy = 'name'; sortAsc = true; } }}>
          Name {sortBy === 'name' ? (sortAsc ? '↑' : '↓') : ''}
        </button>
        <button class="list-header-col size" onclick={() => { if (sortBy === 'size') sortAsc = !sortAsc; else { sortBy = 'size'; sortAsc = true; } }}>
          Size {sortBy === 'size' ? (sortAsc ? '↑' : '↓') : ''}
        </button>
        <button class="list-header-col date" onclick={() => { if (sortBy === 'date') sortAsc = !sortAsc; else { sortBy = 'date'; sortAsc = true; } }}>
          Modified {sortBy === 'date' ? (sortAsc ? '↑' : '↓') : ''}
        </button>
      </div>
    {/if}

    <!-- File list/grid -->
    <div
      class="file-container"
      class:grid-view={viewMode === 'grid'}
      class:list-view={viewMode === 'list'}
      oncontextmenu={(e) => handleContextMenu(e)}
      role="grid"
    >
      {#if isLoading}
        <div class="loading">
          <div class="spinner"></div>
          <span>Loading...</span>
        </div>
      {:else if error}
        <div class="error-banner">
          {error}
        </div>
      {:else if filteredFiles().length === 0}
        <div class="empty-state">
          {#if searchQuery}
            <div class="empty-state-icon">&#128269;</div>
            <div class="empty-state-title">No files match "{searchQuery}"</div>
          {:else}
            <div class="empty-state-icon">&#128193;</div>
            <div class="empty-state-title">This folder is empty</div>
            <div class="empty-state-body">Create a new file or folder to get started</div>
          {/if}
        </div>
      {:else}
        {#each filteredFiles() as file (file.path)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="file-item"
            class:selected={selectedFiles.has(file.path)}
            class:cut={clipboard.operation === 'cut' && clipboard.paths.includes(file.path)}
            onclick={(e) => handleFileClick(file, e)}
            ondblclick={() => handleFileDoubleClick(file)}
            oncontextmenu={(e) => handleContextMenu(e, file)}
            role="gridcell"
            tabindex="0"
          >
            {#if renaming && renaming.path === file.path}
              <div class="file-icon" data-type={getFileIcon(file)}></div>
              <input
                type="text"
                class="rename-input"
                bind:value={renaming.name}
                onblur={finishRename}
                onkeydown={(e) => { if (e.key === 'Enter') finishRename(); if (e.key === 'Escape') cancelRename(); }}
                autofocus
              />
            {:else}
              <div class="file-icon" data-type={getFileIcon(file)}></div>
              <span class="file-name">{file.name}</span>
              {#if viewMode === 'list'}
                <span class="file-size">{formatFileSize(file.size)}</span>
                <span class="file-date">{formatDate(file.modifiedAt)}</span>
              {/if}
            {/if}
          </div>
        {/each}

        <!-- New item input -->
        {#if creating}
          <div class="file-item creating">
            <div class="file-icon" data-type={creating.type === 'folder' ? 'folder' : 'file'}></div>
            <input
              type="text"
              class="rename-input"
              bind:value={creating.name}
              onblur={finishCreate}
              onkeydown={(e) => { if (e.key === 'Enter') finishCreate(); if (e.key === 'Escape') cancelCreate(); }}
              autofocus
            />
          </div>
        {/if}
      {/if}
    </div>

    <!-- Status bar -->
    <div class="status-bar">
      <span class="status-left">
        {filteredFiles().length} item{filteredFiles().length !== 1 ? 's' : ''}
        {#if selectedFiles.size > 0}
          <span class="status-sep">|</span>
          {selectedFiles.size} selected
        {/if}
      </span>
      <span class="status-right">
        {#if hasClipboard}
          <span class="clipboard-indicator">
            {clipboard.operation === 'cut' ? 'Cut' : 'Copied'}: {clipboard.paths.length} item{clipboard.paths.length !== 1 ? 's' : ''}
          </span>
        {/if}
      </span>
    </div>
  </div>

  <!-- Context Menu -->
  {#if contextMenu.visible}
    <div
      class="context-menu"
      style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
      onclick={(e) => e.stopPropagation()}
    >
      {#if contextMenu.type === 'file'}
        <button class="context-item" onclick={handleOpen}>
          <span class="context-icon">O</span>
          Open
        </button>
        <div class="context-divider"></div>
        <button class="context-item" onclick={handleCut}>
          <span class="context-icon">X</span>
          Cut
          <span class="context-shortcut">Ctrl+X</span>
        </button>
        <button class="context-item" onclick={handleCopy}>
          <span class="context-icon">C</span>
          Copy
          <span class="context-shortcut">Ctrl+C</span>
        </button>
        {#if hasClipboard}
          <button class="context-item" onclick={handlePaste}>
            <span class="context-icon">V</span>
            Paste
            <span class="context-shortcut">Ctrl+V</span>
          </button>
        {/if}
        <div class="context-divider"></div>
        {#if selectedFiles.size === 1}
          <button class="context-item" onclick={startRename}>
            <span class="context-icon">R</span>
            Rename
            <span class="context-shortcut">F2</span>
          </button>
        {/if}
        <button class="context-item danger" onclick={handleDelete}>
          <span class="context-icon">D</span>
          Delete
          <span class="context-shortcut">Del</span>
        </button>
      {:else}
        <button class="context-item" onclick={() => startCreateNew('folder')}>
          <span class="context-icon">+</span>
          New Folder
          <span class="context-shortcut">Ctrl+Shift+N</span>
        </button>
        <button class="context-item" onclick={() => startCreateNew('file')}>
          <span class="context-icon">+</span>
          New File
          <span class="context-shortcut">Ctrl+N</span>
        </button>
        {#if hasClipboard}
          <div class="context-divider"></div>
          <button class="context-item" onclick={handlePaste}>
            <span class="context-icon">V</span>
            Paste
            <span class="context-shortcut">Ctrl+V</span>
          </button>
        {/if}
        <div class="context-divider"></div>
        <button class="context-item" onclick={() => loadDirectory(currentPath, false)}>
          <span class="context-icon">R</span>
          Refresh
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .file-browser {
    display: flex;
    height: 100%;
    background: #0f172a;
    color: #e2e8f0;
    font-family: var(--desktop-font-sans);
    font-size: var(--text-sm);
  }

  /* Sidebar */
  .sidebar {
    width: 200px;
    background: #1e293b;
    border-right: 1px solid #334155;
    padding: 8px 0;
    flex-shrink: 0;
    overflow-y: auto;
  }

  .sidebar-section {
    margin-bottom: 16px;
  }

  .sidebar-header {
    padding: 8px 16px;
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
  }

  .sidebar-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 16px;
    min-height: 44px;
    background: transparent;
    border: none;
    color: #e2e8f0;
    cursor: pointer;
    text-align: left;
    transition: background var(--transition-fast) var(--transition-easing);
  }

  .sidebar-item:hover {
    background: #334155;
  }

  .sidebar-item.active {
    background: #6366f1;
    color: white;
  }

  .sidebar-icon {
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .sidebar-icon[data-icon="home"]::before { content: "\1F3E0"; }
  .sidebar-icon[data-icon="desktop"]::before { content: "\1F5A5"; }
  .sidebar-icon[data-icon="folder"]::before { content: "\1F4C1"; }
  .sidebar-icon[data-icon="download"]::before { content: "\2B07\FE0F"; }
  .sidebar-icon[data-icon="image"]::before { content: "\1F5BC"; }

  /* Main content */
  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  /* Toolbar */
  .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #1e293b;
    border-bottom: 1px solid #334155;
  }

  .toolbar-nav {
    display: flex;
    gap: 4px;
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    color: #94a3b8;
    cursor: pointer;
    transition: all var(--transition-fast) var(--transition-easing);
  }

  .toolbar-btn:hover:not(:disabled) {
    background: #334155;
    color: #e2e8f0;
    border-color: #475569;
  }

  .toolbar-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .toolbar-btn.active {
    background: #6366f1;
    color: white;
    border-color: #6366f1;
  }

  .toolbar-btn svg {
    width: 16px;
    height: 16px;
  }

  /* Breadcrumbs */
  .breadcrumbs {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 0 8px;
    overflow-x: auto;
    white-space: nowrap;
  }

  .breadcrumb {
    padding: 4px 8px;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    color: #6366f1;
    cursor: pointer;
    transition: background var(--transition-fast) var(--transition-easing);
  }

  .breadcrumb:hover:not(.active) {
    background: #334155;
  }

  .breadcrumb.active {
    color: #e2e8f0;
    cursor: default;
  }

  .breadcrumb-sep {
    color: #475569;
    padding: 0 2px;
  }

  /* Search */
  .search-box {
    position: relative;
    width: 200px;
  }

  .search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 14px;
    height: 14px;
    color: #64748b;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 6px 12px 6px 32px;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: var(--radius-sm);
    color: #e2e8f0;
    font-size: var(--text-sm);
    outline: none;
    transition: border-color var(--transition-fast) var(--transition-easing);
  }

  .search-input:focus {
    border-color: #6366f1;
  }

  .search-input::placeholder {
    color: #64748b;
  }

  /* View toggle */
  .view-toggle {
    display: flex;
    gap: 2px;
    background: #0f172a;
    padding: 2px;
    border-radius: var(--radius-sm);
  }

  .toolbar-actions {
    display: flex;
    gap: 4px;
    margin-left: 8px;
    padding-left: 8px;
    border-left: 1px solid #334155;
  }

  /* List header */
  .list-header {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    background: #1e293b;
    border-bottom: 1px solid #334155;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
  }

  .list-header-col {
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0;
    transition: color 0.15s;
  }

  .list-header-col:hover {
    color: #e2e8f0;
  }

  .list-header-col.name { flex: 1; }
  .list-header-col.size { width: 100px; }
  .list-header-col.date { width: 120px; }

  /* File container */
  .file-container {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  .file-container.grid-view {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
    align-content: start;
  }

  .file-container.list-view {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  /* File item */
  .file-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background var(--transition-fast) var(--transition-easing);
    user-select: none;
  }

  .file-item:hover {
    background: #1e293b;
  }

  .file-item.selected {
    background: #334155;
  }

  .file-item.cut {
    opacity: 0.5;
  }

  .grid-view .file-item {
    flex-direction: column;
    text-align: center;
    padding: 12px 8px;
  }

  .list-view .file-item {
    padding: 6px 12px;
  }

  /* File icon */
  .file-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    flex-shrink: 0;
  }

  .list-view .file-icon {
    width: 24px;
    height: 24px;
    font-size: 18px;
  }

  .file-icon::before {
    display: block;
  }

  /* File type icons using emoji */
  .file-icon[data-type="folder"]::before { content: "\1F4C1"; }
  .file-icon[data-type="file"]::before { content: "\1F4C4"; }
  .file-icon[data-type="text"]::before { content: "\1F4DD"; }
  .file-icon[data-type="markdown"]::before { content: "\1F4D1"; }
  .file-icon[data-type="pdf"]::before { content: "\1F4D5"; }
  .file-icon[data-type="image"]::before { content: "\1F5BC"; }
  .file-icon[data-type="video"]::before { content: "\1F3AC"; }
  .file-icon[data-type="audio"]::before { content: "\1F3B5"; }
  .file-icon[data-type="archive"]::before { content: "\1F4E6"; }
  .file-icon[data-type="javascript"]::before { content: "\1F7E8"; }
  .file-icon[data-type="typescript"]::before { content: "\1F535"; }
  .file-icon[data-type="python"]::before { content: "\1F40D"; }
  .file-icon[data-type="html"]::before { content: "\1F310"; }
  .file-icon[data-type="css"]::before { content: "\1F3A8"; }
  .file-icon[data-type="json"]::before { content: "\1F4CB"; }
  .file-icon[data-type="svelte"]::before { content: "\1F525"; }
  .file-icon[data-type="drawing"]::before { content: "\270F\FE0F"; }
  .file-icon[data-type="word"]::before { content: "\1F4D8"; }

  /* File name */
  .file-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .grid-view .file-name {
    max-width: 100%;
    font-size: 12px;
    line-height: 1.3;
    word-break: break-word;
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .list-view .file-name {
    flex: 1;
    min-width: 0;
  }

  .list-view .file-size,
  .list-view .file-date {
    color: #64748b;
    font-size: 12px;
  }

  .list-view .file-size {
    width: 100px;
    text-align: right;
  }

  .list-view .file-date {
    width: 120px;
    text-align: right;
  }

  /* Rename input */
  .rename-input {
    width: 100%;
    max-width: 150px;
    padding: 4px 8px;
    background: #0f172a;
    border: 1px solid #6366f1;
    border-radius: var(--radius-sm);
    color: #e2e8f0;
    font-size: var(--text-xs);
    outline: none;
  }

  .grid-view .rename-input {
    text-align: center;
  }

  /* Loading, error, empty states */
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #64748b;
    gap: 12px;
  }

  .loading .spinner {
    width: 32px;
    height: 32px;
    border-width: 3px;
  }

  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    gap: 12px;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #64748b;
    gap: 12px;
  }

  .error-icon, .empty-icon {
    font-size: 48px;
    opacity: 0.35;
    line-height: 1;
  }

  .error-icon {
    color: var(--color-error-text);
  }

  /* Status bar */
  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 12px;
    background: #1e293b;
    border-top: 1px solid #334155;
    font-size: 11px;
    color: #64748b;
  }

  .status-sep {
    margin: 0 8px;
    color: #475569;
  }

  .clipboard-indicator {
    padding: 2px 8px;
    background: #6366f1;
    border-radius: var(--radius-sm);
    color: white;
    font-size: var(--text-xs);
  }

  /* Context menu */
  .context-menu {
    position: fixed;
    background: var(--glass-bg-strong);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    border: var(--glass-border);
    border-radius: var(--radius-lg);
    padding: 6px 0;
    min-width: 180px;
    box-shadow: var(--glass-shadow-lg);
    z-index: 10000;
  }

  .context-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 12px;
    min-height: 44px;
    background: transparent;
    border: none;
    color: #e2e8f0;
    cursor: pointer;
    text-align: left;
    font-size: var(--text-sm);
    transition: background var(--transition-fast) var(--transition-easing);
  }

  .context-item:hover {
    background: #334155;
  }

  .context-item.danger:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  .context-icon {
    width: 16px;
    text-align: center;
    color: #64748b;
    font-size: var(--text-xs);
  }

  .context-shortcut {
    margin-left: auto;
    font-size: var(--text-xs);
    color: #64748b;
  }

  .context-divider {
    height: 1px;
    background: #334155;
    margin: 6px 0;
  }

  /* Scrollbar */
  .file-container::-webkit-scrollbar,
  .sidebar::-webkit-scrollbar {
    width: var(--scrollbar-width);
  }

  .file-container::-webkit-scrollbar-track,
  .sidebar::-webkit-scrollbar-track {
    background: transparent;
  }

  .file-container::-webkit-scrollbar-thumb,
  .sidebar::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: var(--radius-full);
  }

  .file-container::-webkit-scrollbar-thumb:hover,
  .sidebar::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover);
  }
</style>

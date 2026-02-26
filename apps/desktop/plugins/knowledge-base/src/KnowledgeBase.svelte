<script lang="ts">
  import { onMount } from 'svelte';
  import type { KBNote, BacklinkRef } from './types';
  import { getAllNotes, saveNote, deleteNote, extractBacklinks, extractTags } from './store';
  import { PUBLIC_PYTHON_API_URL } from '$env/static/public';

  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  // State
  let notes = $state<KBNote[]>([]);
  let activeNoteId = $state<string | null>(null);
  let editorContent = $state('');
  let editorTitle = $state('');
  let searchQuery = $state('');
  let selectedTag = $state<string | null>(null);
  let activeTab = $state<'edit' | 'preview' | 'graph' | 'vault'>('edit');
  let isLoading = $state(true);
  let showDeleteConfirm = $state(false);
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  // Derived
  const activeNote = $derived(() => {
    if (!activeNoteId) return null;
    return notes.find(n => n.id === activeNoteId) ?? null;
  });

  const allTags = $derived(() => {
    const tagSet = new Set<string>();
    for (const note of notes) {
      for (const tag of note.tags) tagSet.add(tag);
    }
    return [...tagSet].sort();
  });

  const filteredNotes = $derived(() => {
    return notes
      .filter(note => {
        const matchesSearch = !searchQuery ||
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = !selectedTag || note.tags.includes(selectedTag);
        return matchesSearch && matchesTag;
      })
      .sort((a, b) => b.updated - a.updated);
  });

  const backlinks = $derived(() => {
    if (!activeNote()) return [] as BacklinkRef[];
    const currentTitle = activeNote()!.title;
    const refs: BacklinkRef[] = [];
    for (const note of notes) {
      if (note.id === activeNoteId) continue;
      const links = extractBacklinks(note.content);
      if (links.includes(currentTitle)) {
        const idx = note.content.indexOf(`[[${currentTitle}]]`);
        const start = Math.max(0, idx - 40);
        const end = Math.min(note.content.length, idx + currentTitle.length + 4 + 40);
        refs.push({
          sourceId: note.id,
          sourceTitle: note.title,
          context: '...' + note.content.slice(start, end) + '...'
        });
      }
    }
    return refs;
  });

  // === Vault Search State ===
  let vaultQuery = $state('');
  let vaultResults = $state<any[]>([]);
  let vaultLoading = $state(false);
  let vaultAvailable = $state(true);
  let vaultError = $state('');
  let vaultExpandedIdx = $state<number | null>(null);

  // === Conversational Q&A State ===
  interface QAMessage {
    role: 'user' | 'assistant';
    content: string;
    sources?: any[];
  }
  let qaMessages = $state<QAMessage[]>([]);
  let qaInput = $state('');
  let qaLoading = $state(false);

  const suggestedQueries = [
    "What is MRAX?",
    "Tell me about the plugin architecture",
    "What projects has Rick worked on?",
    "How does the VFS work?",
    "Explain the desktop-os shell layer",
  ];

  async function searchVault() {
    if (!vaultQuery.trim()) return;
    vaultLoading = true;
    vaultError = '';
    try {
      const params = new URLSearchParams({ q: vaultQuery, top_k: '10' });
      const res = await fetch(`${PUBLIC_PYTHON_API_URL}/api/knowledge/search?${params}`);
      if (res.status === 503) { vaultAvailable = false; vaultResults = []; return; }
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      vaultAvailable = data.rag_available;
      vaultResults = data.results;
    } catch (e) {
      vaultError = e instanceof Error ? e.message : 'Search failed. Is the backend running?';
      vaultResults = [];
    } finally {
      vaultLoading = false;
    }
  }

  function handleVaultKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') searchVault();
  }

  // Highlight matched terms in text
  function highlightText(text: string, query: string): string {
    if (!query.trim()) return escapeHtml(text);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark class="highlight">$1</mark>');
  }

  function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // === Conversational Q&A ===
  async function sendQA(query?: string) {
    const q = query || qaInput.trim();
    if (!q) return;
    qaInput = '';
    qaLoading = true;

    qaMessages = [...qaMessages, { role: 'user', content: q }];

    try {
      // Use the chat stream endpoint with RAG
      const res = await fetch(`${PUBLIC_PYTHON_API_URL}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: qaMessages.map(m => ({ role: m.role, content: m.content })),
          use_rag: true,
          system: "You are a knowledge base assistant. Answer questions based on the provided context from the user's Obsidian vault. Be concise and cite sources when possible."
        })
      });

      if (!res.ok) throw new Error('Q&A request failed');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.token) fullContent += parsed.token;
              } catch { /* skip */ }
            }
          }
        }
      }

      qaMessages = [...qaMessages, { role: 'assistant', content: fullContent }];
    } catch (e) {
      qaMessages = [...qaMessages, {
        role: 'assistant',
        content: `Sorry, I couldn't process that question. ${e instanceof Error ? e.message : 'The backend may be unavailable.'}`
      }];
    } finally {
      qaLoading = false;
    }
  }

  function handleQAKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQA();
    }
  }

  function getBasename(path: string): string {
    return path.split('/').pop() ?? path;
  }

  function getScoreColor(score: number): string {
    if (score >= 0.8) return '#22c55e';
    if (score >= 0.6) return '#f59e0b';
    return '#94a3b8';
  }

  // Load notes on mount
  onMount(async () => {
    try {
      notes = await getAllNotes();
    } catch {
      notes = [];
    }
    isLoading = false;
  });

  function createNote(title?: string) {
    const now = Date.now();
    const newNote: KBNote = {
      id: crypto.randomUUID(),
      title: title ?? 'Untitled Note',
      content: '',
      tags: [],
      created: now,
      updated: now
    };
    notes = [newNote, ...notes];
    selectNote(newNote.id);
    saveNote(newNote);
  }

  function createDailyNote() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const existing = notes.find(n => n.title === dateStr);
    if (existing) { selectNote(existing.id); return; }
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    createNote(dateStr);
    editorContent = `# ${dateStr} - ${dayName}\n\n## Tasks\n\n- [ ] \n\n## Notes\n\n`;
    debouncedSave();
  }

  function selectNote(id: string) {
    activeNoteId = id;
    const note = notes.find(n => n.id === id);
    if (note) {
      editorTitle = note.title;
      editorContent = note.content;
    }
    activeTab = 'edit';
  }

  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => persistCurrentNote(), 500);
  }

  async function persistCurrentNote() {
    if (!activeNoteId) return;
    const idx = notes.findIndex(n => n.id === activeNoteId);
    if (idx === -1) return;

    const tags = extractTags(editorContent);
    const updatedNote: KBNote = {
      ...notes[idx],
      title: editorTitle,
      content: editorContent,
      tags,
      updated: Date.now()
    };
    notes = notes.map(n => n.id === activeNoteId ? updatedNote : n);
    await saveNote(updatedNote);
  }

  function handleTitleChange(e: Event) {
    editorTitle = (e.target as HTMLInputElement).value;
    debouncedSave();
  }

  function handleContentChange(e: Event) {
    editorContent = (e.target as HTMLTextAreaElement).value;
    debouncedSave();
  }

  async function handleDelete() {
    if (!activeNoteId) return;
    await deleteNote(activeNoteId);
    notes = notes.filter(n => n.id !== activeNoteId);
    activeNoteId = null;
    editorContent = '';
    editorTitle = '';
    showDeleteConfirm = false;
  }

  function navigateToLink(title: string) {
    const existing = notes.find(n => n.title === title);
    if (existing) selectNote(existing.id);
    else createNote(title);
  }

  // Simple markdown preview
  function renderPreview(content: string): string {
    let html = content
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^- \[x\] (.+)$/gm, '<div class="checkbox checked"><span class="check-mark">&#10003;</span> $1</div>')
      .replace(/^- \[ \] (.+)$/gm, '<div class="checkbox"><span class="check-box">&#9744;</span> $1</div>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^---$/gm, '<hr/>')
      .replace(/#([a-zA-Z0-9_-]+)/g, '<span class="tag-highlight">#$1</span>')
      .replace(/\n/g, '<br/>');

    html = html.replace(/\[\[([^\]]+)\]\]/g, '<a class="backlink" data-link="$1">[[$1]]</a>');
    return html;
  }

  function handlePreviewClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const link = target.closest('.backlink') as HTMLElement | null;
    if (link) {
      const title = link.dataset.link;
      if (title) navigateToLink(title);
    }
  }

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
</script>

<div class="knowledge-base">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2 class="sidebar-title">Notes</h2>
      <span class="note-count">{notes.length}</span>
    </div>

    <div class="sidebar-actions">
      <button class="action-btn primary" onclick={() => createNote()}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        New Note
      </button>
      <button class="action-btn secondary" onclick={createDailyNote} title="Create daily note">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>
    </div>

    <div class="sidebar-search">
      <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
      <input type="text" class="search-input" placeholder="Search notes..." bind:value={searchQuery} />
    </div>

    {#if allTags().length > 0}
      <div class="tag-filter">
        <button class="tag-pill" class:active={!selectedTag} onclick={() => selectedTag = null}>All</button>
        {#each allTags() as tag}
          <button class="tag-pill" class:active={selectedTag === tag} onclick={() => selectedTag = selectedTag === tag ? null : tag}>#{tag}</button>
        {/each}
      </div>
    {/if}

    <div class="note-list">
      {#if isLoading}
        <div class="loading-state">
          <span class="spinner spinner-sm"></span>
          Loading notes...
        </div>
      {:else if filteredNotes().length === 0}
        <div class="empty-sidebar">
          {#if notes.length === 0}
            <span class="empty-icon-small">📝</span>
            <p>No notes yet</p>
          {:else}
            <p>No matches</p>
          {/if}
        </div>
      {:else}
        {#each filteredNotes() as note}
          <button class="note-item" class:active={note.id === activeNoteId} onclick={() => selectNote(note.id)}>
            <span class="note-title">
              {#if searchQuery}
                {@html highlightText(note.title, searchQuery)}
              {:else}
                {note.title}
              {/if}
            </span>
            <span class="note-meta">
              <span class="note-date">{formatDate(note.updated)}</span>
              {#if note.tags.length > 0}
                <span class="note-tags-preview">{note.tags.slice(0, 2).map(t => `#${t}`).join(' ')}</span>
              {/if}
            </span>
          </button>
        {/each}
      {/if}
    </div>
  </aside>

  <!-- Main Content -->
  <main class="content">
    {#if activeNote()}
      <div class="editor-header">
        <input type="text" class="title-input" value={editorTitle} oninput={handleTitleChange} placeholder="Note title..." />
        <div class="editor-actions">
          <button class="delete-btn" onclick={() => showDeleteConfirm = true} title="Delete note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="tabs">
        <button class="tab" class:active={activeTab === 'edit'} onclick={() => activeTab = 'edit'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit
        </button>
        <button class="tab" class:active={activeTab === 'preview'} onclick={() => activeTab = 'preview'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          Preview
        </button>
        <button class="tab" class:active={activeTab === 'graph'} onclick={() => activeTab = 'graph'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><line x1="8.5" y1="7.5" x2="15.5" y2="16.5"/><line x1="8.5" y1="6" x2="15.5" y2="6"/>
          </svg>
          Graph
        </button>
        <button class="tab" class:active={activeTab === 'vault'} onclick={() => activeTab = 'vault'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          Vault
        </button>
      </div>

      <div class="editor-area">
        {#if activeTab === 'edit'}
          <textarea
            class="editor-textarea"
            value={editorContent}
            oninput={handleContentChange}
            placeholder="Start writing... Use [[backlinks]] and #tags"
            spellcheck="false"
          ></textarea>
        {:else if activeTab === 'preview'}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="preview" onclick={handlePreviewClick}>
            {#if editorContent}
              {@html renderPreview(editorContent)}
            {:else}
              <p class="preview-empty">Nothing to preview</p>
            {/if}
          </div>
        {:else if activeTab === 'graph'}
          <div class="graph-placeholder">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,0.3)" stroke-width="1">
              <circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <line x1="8.5" y1="7.5" x2="15.5" y2="16.5"/><line x1="8.5" y1="6" x2="15.5" y2="6"/><line x1="6" y1="9" x2="6" y2="15"/><line x1="15.5" y1="17.5" x2="8.5" y2="17.5"/>
            </svg>
            <h3>Graph View</h3>
            <p>Interactive graph visualization coming soon.</p>
            <p class="graph-stats">{notes.length} notes &middot; {allTags().length} tags &middot; {backlinks().length} backlinks to this note</p>
          </div>
        {:else if activeTab === 'vault'}
          <div class="vault-tab">
            <!-- Search Bar -->
            <div class="vault-search-bar">
              <input type="text" class="vault-search-input" placeholder="Search your Obsidian vault..." bind:value={vaultQuery} onkeydown={handleVaultKeydown} />
              <button class="vault-search-btn" onclick={searchVault} disabled={vaultLoading || !vaultQuery.trim()}>
                {#if vaultLoading}
                  <span class="spinner spinner-sm"></span>
                {:else}
                  Search
                {/if}
              </button>
            </div>

            {#if !vaultAvailable}
              <div class="vault-banner">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Vault offline — ChromaDB unavailable. Start the backend to enable semantic search.
              </div>
            {/if}

            {#if vaultError}
              <div class="vault-error-msg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {vaultError}
              </div>
            {/if}

            {#if vaultLoading}
              <div class="vault-loading-state">
                <span class="spinner"></span>
                <p>Searching vault...</p>
                <p class="loading-hint">Semantic search across your Obsidian vault via ChromaDB</p>
              </div>
            {:else if vaultResults.length > 0}
              <div class="vault-results">
                {#each vaultResults as result, idx}
                  <!-- svelte-ignore a11y_click_events_have_key_events -->
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <div class="vault-result-item" class:expanded={vaultExpandedIdx === idx} onclick={() => vaultExpandedIdx = vaultExpandedIdx === idx ? null : idx}>
                    <div class="vault-result-header">
                      <span class="vault-result-source">{getBasename(result.source ?? result.path ?? '')}</span>
                      <div class="vault-result-badges">
                        {#if result.score != null}
                          <span class="vault-result-score" style="color: {getScoreColor(result.score)}">
                            {(result.score * 100).toFixed(0)}% match
                          </span>
                        {/if}
                      </div>
                    </div>
                    <p class="vault-result-preview">
                      {#if vaultExpandedIdx === idx}
                        {@html highlightText(result.content ?? result.text ?? '', vaultQuery)}
                      {:else}
                        {@html highlightText((result.content ?? result.text ?? '').slice(0, 200) + ((result.content ?? result.text ?? '').length > 200 ? '...' : ''), vaultQuery)}
                      {/if}
                    </p>
                  </div>
                {/each}
              </div>
            {:else if vaultQuery.trim() === ''}
              <div class="vault-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,0.3)" stroke-width="1.5">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <h3>Search your Obsidian vault</h3>
                <p>Semantic search across all vault documents via ChromaDB</p>
                <div class="suggested-queries">
                  <p class="suggested-label">Try asking:</p>
                  {#each suggestedQueries.slice(0, 3) as sq}
                    <button class="suggested-btn" onclick={() => { vaultQuery = sq; searchVault(); }}>
                      "{sq}"
                    </button>
                  {/each}
                </div>
              </div>
            {:else if vaultResults.length === 0}
              <div class="vault-empty">
                <p>No results found for "{vaultQuery}"</p>
                <p class="vault-empty-hint">Try different keywords or check if the backend is running</p>
              </div>
            {/if}

            <!-- Conversational Q&A Section -->
            <div class="qa-section">
              <div class="qa-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <span>Ask a question</span>
              </div>

              {#if qaMessages.length > 0}
                <div class="qa-messages">
                  {#each qaMessages as msg}
                    <div class="qa-msg {msg.role}">
                      <span class="qa-avatar">{msg.role === 'user' ? '👤' : '🧠'}</span>
                      <div class="qa-content">{msg.content}</div>
                    </div>
                  {/each}
                  {#if qaLoading}
                    <div class="qa-msg assistant">
                      <span class="qa-avatar">🧠</span>
                      <div class="qa-content qa-typing">
                        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                      </div>
                    </div>
                  {/if}
                </div>
              {:else}
                <div class="qa-suggestions">
                  {#each suggestedQueries as sq}
                    <button class="qa-suggestion-btn" onclick={() => sendQA(sq)}>
                      {sq}
                    </button>
                  {/each}
                </div>
              {/if}

              <div class="qa-input-row">
                <input
                  type="text"
                  class="qa-input"
                  bind:value={qaInput}
                  onkeydown={handleQAKeydown}
                  placeholder="Ask about your knowledge base..."
                  disabled={qaLoading}
                />
                <button class="qa-send" onclick={() => sendQA()} disabled={qaLoading || !qaInput.trim()}>
                  {#if qaLoading}
                    <span class="spinner spinner-sm"></span>
                  {:else}
                    Ask
                  {/if}
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>

      {#if backlinks().length > 0 && activeTab !== 'graph' && activeTab !== 'vault'}
        <div class="backlinks-panel">
          <h4 class="backlinks-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
            </svg>
            {backlinks().length} Backlink{backlinks().length !== 1 ? 's' : ''}
          </h4>
          <div class="backlinks-list">
            {#each backlinks() as ref}
              <button class="backlink-item" onclick={() => selectNote(ref.sourceId)}>
                <span class="backlink-source">{ref.sourceTitle}</span>
                <span class="backlink-context">{ref.context}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    {:else}
      <div class="empty-state">
        <div class="empty-icon-large">🧠</div>
        <h2 class="empty-title">Knowledge Base</h2>
        <p class="empty-text">Create your first note to get started.</p>
        <p class="empty-hint">Use <code>[[backlinks]]</code> to connect notes and <code>#tags</code> to organize them.</p>
        <button class="empty-action" onclick={() => createNote()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create First Note
        </button>
      </div>
    {/if}
  </main>

  <!-- Delete Confirmation -->
  {#if showDeleteConfirm}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="confirm-overlay" onclick={() => showDeleteConfirm = false}>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="confirm-dialog" onclick={(e) => e.stopPropagation()}>
        <h3>Delete Note</h3>
        <p>Are you sure you want to delete "{editorTitle}"? This cannot be undone.</p>
        <div class="confirm-actions">
          <button class="confirm-btn cancel" onclick={() => showDeleteConfirm = false}>Cancel</button>
          <button class="confirm-btn delete" onclick={handleDelete}>Delete</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .knowledge-base {
    display: flex;
    height: 100%;
    background: #0f172a;
    font-family: var(--desktop-font-sans);
    position: relative;
  }

  /* Sidebar */
  .sidebar {
    width: 260px;
    min-width: 260px;
    display: flex;
    flex-direction: column;
    background: #1e293b;
    border-right: 1px solid #334155;
  }

  .sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 8px; }
  .sidebar-title { margin: 0; font-size: var(--text-md); font-weight: 600; color: #f1f5f9; }
  .note-count { font-size: var(--text-xs); color: #64748b; background: rgba(99, 102, 241, 0.15); padding: 2px 8px; border-radius: var(--radius-full); }

  .sidebar-actions { display: flex; gap: 8px; padding: 8px 16px; }

  .action-btn {
    display: flex; align-items: center; gap: 6px; padding: 8px 12px; min-height: 44px;
    border-radius: var(--radius-md); font-size: var(--text-sm); font-weight: 500;
    cursor: pointer; transition: all var(--transition-normal) var(--transition-easing); border: none;
  }

  .action-btn.primary { flex: 1; background: #6366f1; color: white; justify-content: center; }
  .action-btn.primary:hover { background: #818cf8; }
  .action-btn.secondary { background: rgba(99, 102, 241, 0.15); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.2); }
  .action-btn.secondary:hover { background: rgba(99, 102, 241, 0.25); }

  .sidebar-search { position: relative; padding: 4px 16px; }
  .sidebar-search .search-icon { position: absolute; left: 28px; top: 50%; transform: translateY(-50%); color: #64748b; pointer-events: none; }
  .sidebar-search .search-input {
    width: 100%; padding: 8px 12px 8px 32px; background: rgba(15, 23, 42, 0.6);
    border: 1px solid #334155; border-radius: var(--radius-md); color: #f1f5f9;
    font-size: var(--text-sm); outline: none; box-sizing: border-box;
    transition: all var(--transition-normal) var(--transition-easing);
  }
  .sidebar-search .search-input::placeholder { color: #64748b; }
  .sidebar-search .search-input:focus { border-color: rgba(99, 102, 241, 0.5); }

  .tag-filter { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 16px; max-height: 60px; overflow-y: auto; }

  .tag-pill {
    padding: 2px 8px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: var(--radius-full); color: #94a3b8; font-size: var(--text-xs);
    cursor: pointer; transition: all var(--transition-normal) var(--transition-easing); white-space: nowrap;
  }
  .tag-pill:hover { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; }
  .tag-pill.active { background: rgba(99, 102, 241, 0.3); border-color: rgba(99, 102, 241, 0.5); color: #a5b4fc; }

  .note-list { flex: 1; overflow-y: auto; padding: 4px 8px; }
  .note-list::-webkit-scrollbar { width: var(--scrollbar-width); }
  .note-list::-webkit-scrollbar-track { background: transparent; }
  .note-list::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: var(--radius-full); }

  .note-item {
    display: flex; flex-direction: column; gap: 4px; width: 100%; padding: 10px 12px; margin-bottom: 2px;
    background: transparent; border: none; border-left: 2px solid transparent; border-radius: var(--radius-sm);
    text-align: left; cursor: pointer; color: #e2e8f0;
    transition: all var(--transition-fast) var(--transition-easing);
  }
  .note-item:hover { background: rgba(99, 102, 241, 0.08); }
  .note-item.active { background: rgba(99, 102, 241, 0.1); border-left-color: #6366f1; }

  .note-title { font-size: 0.85rem; font-weight: 500; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .note-meta { display: flex; align-items: center; gap: 8px; }
  .note-date { font-size: 0.7rem; color: #64748b; }
  .note-tags-preview { font-size: 0.65rem; color: #6366f1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* Highlight in search results */
  :global(.highlight) { background: rgba(99, 102, 241, 0.35); color: #e0e7ff; border-radius: 2px; padding: 0 1px; }

  .loading-state, .empty-sidebar {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 40px 16px; color: #64748b; font-size: 0.85rem; text-align: center; gap: 8px;
  }
  .empty-icon-small { font-size: 1.5rem; margin-bottom: 8px; opacity: 0.5; }

  /* Main Content */
  .content { flex: 1; display: flex; flex-direction: column; background: #0f172a; overflow: hidden; }

  .editor-header { display: flex; align-items: center; gap: 12px; padding: 12px 20px; border-bottom: 1px solid #334155; flex-shrink: 0; }
  .title-input { flex: 1; padding: 6px 0; background: transparent; border: none; color: #f1f5f9; font-size: 1.25rem; font-weight: 600; outline: none; }
  .title-input::placeholder { color: #475569; }

  .editor-actions { display: flex; gap: 8px; }
  .delete-btn {
    width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
    background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm);
    color: #64748b; cursor: pointer; transition: all var(--transition-normal) var(--transition-easing);
  }
  .delete-btn:hover { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); color: #ef4444; }

  .tabs { display: flex; gap: 4px; padding: 8px 20px; border-bottom: 1px solid rgba(51, 65, 85, 0.5); flex-shrink: 0; }
  .tab {
    display: flex; align-items: center; gap: 6px; padding: 6px 14px; min-height: 44px;
    background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm);
    color: #64748b; font-size: var(--text-sm); font-weight: 500; cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
  }
  .tab:hover { color: #94a3b8; background: rgba(99, 102, 241, 0.08); }
  .tab.active { color: #a5b4fc; background: rgba(99, 102, 241, 0.15); border-color: rgba(99, 102, 241, 0.25); }

  .editor-area { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

  .editor-textarea {
    flex: 1; width: 100%; padding: 20px; background: transparent; border: none;
    color: #e2e8f0; font-family: var(--desktop-font-mono); font-size: var(--text-base);
    line-height: 1.7; resize: none; outline: none; box-sizing: border-box;
  }
  .editor-textarea::placeholder { color: #475569; }

  /* Preview */
  .preview { flex: 1; overflow-y: auto; padding: 20px; color: #e2e8f0; font-size: 0.9rem; line-height: 1.8; }
  .preview :global(h1) { font-size: 1.5rem; font-weight: 600; color: #f1f5f9; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #334155; }
  .preview :global(h2) { font-size: 1.2rem; font-weight: 600; color: #f1f5f9; margin: 20px 0 8px; }
  .preview :global(h3) { font-size: 1rem; font-weight: 600; color: #e2e8f0; margin: 16px 0 6px; }
  .preview :global(strong) { color: #f1f5f9; font-weight: 600; }
  .preview :global(em) { color: #cbd5e1; }
  .preview :global(code) { background: rgba(99, 102, 241, 0.15); padding: 2px 6px; border-radius: 4px; font-family: var(--desktop-font-mono); font-size: 0.85em; color: #a5b4fc; }
  .preview :global(li) { margin-left: 16px; margin-bottom: 4px; color: #cbd5e1; }
  .preview :global(hr) { border: none; border-top: 1px solid #334155; margin: 20px 0; }
  .preview :global(.checkbox) { display: flex; align-items: center; gap: 8px; padding: 4px 0; color: #94a3b8; }
  .preview :global(.checkbox.checked) { color: #22c55e; text-decoration: line-through; opacity: 0.7; }
  .preview :global(.tag-highlight) { color: #6366f1; font-weight: 500; }
  .preview :global(.backlink) { color: #6366f1; text-decoration: none; background: rgba(99, 102, 241, 0.1); padding: 1px 4px; border-radius: 4px; cursor: pointer; transition: all 0.15s; }
  .preview :global(.backlink:hover) { background: rgba(99, 102, 241, 0.25); color: #a5b4fc; }
  .preview-empty { color: #475569; text-align: center; padding: 40px; }

  /* Graph */
  .graph-placeholder { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #64748b; text-align: center; padding: 40px; }
  .graph-placeholder h3 { margin: 0; font-size: 1.1rem; color: #94a3b8; }
  .graph-placeholder p { margin: 0; font-size: 0.85rem; }
  .graph-stats { font-size: var(--text-sm); color: #64748b; margin-top: 8px; }

  /* Backlinks */
  .backlinks-panel { border-top: 1px solid #334155; padding: 12px 20px; max-height: 160px; overflow-y: auto; flex-shrink: 0; }
  .backlinks-title { display: flex; align-items: center; gap: 6px; margin: 0 0 10px; font-size: 0.8rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  .backlinks-list { display: flex; flex-direction: column; gap: 6px; }
  .backlink-item {
    display: flex; flex-direction: column; gap: 2px; padding: 8px 12px;
    background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.12);
    border-radius: var(--radius-md); text-align: left; cursor: pointer;
    transition: transform var(--transition-normal) var(--transition-easing), box-shadow var(--transition-normal) var(--transition-easing), background var(--transition-normal) var(--transition-easing);
  }
  .backlink-item:hover { background: rgba(99, 102, 241, 0.15); border-color: rgba(99, 102, 241, 0.3); transform: var(--card-hover-transform); box-shadow: var(--card-hover-shadow); }
  .backlink-source { font-size: 0.8rem; font-weight: 500; color: #a5b4fc; }
  .backlink-context { font-size: 0.7rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* Empty State */
  .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 40px; text-align: center; }
  .empty-icon-large { font-size: 4rem; opacity: 0.4; }
  .empty-title { margin: 0; font-size: 1.5rem; font-weight: 600; color: #94a3b8; }
  .empty-text { margin: 0; font-size: 0.9rem; color: #64748b; }
  .empty-hint { margin: 0; font-size: 0.8rem; color: #64748b; }
  .empty-hint code { background: rgba(99, 102, 241, 0.15); padding: 2px 6px; border-radius: var(--radius-sm); font-family: var(--desktop-font-mono); font-size: 0.85em; color: #a5b4fc; }
  .empty-action {
    display: flex; align-items: center; gap: 8px; margin-top: 8px; padding: 10px 20px;
    background: #6366f1; border: none; border-radius: var(--radius-lg); color: white;
    font-size: 0.9rem; font-weight: 600; cursor: pointer; min-height: 44px;
    transition: all var(--transition-normal) var(--transition-easing);
  }
  .empty-action:hover { background: #818cf8; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4); }

  /* === Vault Tab === */
  .vault-tab { flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 20px; gap: 16px; }
  .vault-search-bar { display: flex; gap: 8px; flex-shrink: 0; }
  .vault-search-input {
    flex: 1; padding: 10px 14px; background: rgba(15, 23, 42, 0.6); border: 1px solid #334155;
    border-radius: var(--radius-md); color: #f1f5f9; font-size: var(--text-sm); outline: none;
    transition: border-color var(--transition-normal) var(--transition-easing); box-sizing: border-box;
  }
  .vault-search-input::placeholder { color: #64748b; }
  .vault-search-input:focus { border-color: rgba(99, 102, 241, 0.5); }
  .vault-search-btn {
    padding: 10px 18px; background: #6366f1; border: none; border-radius: var(--radius-md);
    color: white; font-size: var(--text-sm); font-weight: 500; cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing); white-space: nowrap;
    flex-shrink: 0; min-height: 44px; display: flex; align-items: center; gap: 6px;
  }
  .vault-search-btn:hover:not(:disabled) { background: #818cf8; }
  .vault-search-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .vault-banner {
    display: flex; align-items: center; gap: 8px; padding: 10px 14px;
    background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25);
    border-radius: var(--radius-md); color: #f59e0b; font-size: 0.8rem; font-weight: 500; flex-shrink: 0;
  }

  .vault-error-msg {
    display: flex; align-items: center; gap: 8px; padding: 10px 14px;
    background: var(--color-error-bg); border: 1px solid var(--color-error-border);
    border-radius: var(--radius-md); color: #ef4444; font-size: 0.8rem; flex-shrink: 0;
  }

  .vault-loading-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 12px; padding: 40px; color: #94a3b8; text-align: center;
  }
  .vault-loading-state p { margin: 0; font-size: 0.9rem; }
  .loading-hint { font-size: var(--text-xs) !important; color: #64748b; }

  .vault-results { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
  .vault-results::-webkit-scrollbar { width: var(--scrollbar-width); }
  .vault-results::-webkit-scrollbar-track { background: transparent; }
  .vault-results::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: var(--radius-full); }

  .vault-result-item {
    padding: 12px 14px; background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(99, 102, 241, 0.1);
    border-radius: var(--radius-lg); cursor: pointer; transition: all var(--transition-normal) var(--transition-easing);
  }
  .vault-result-item:hover { border-color: rgba(99, 102, 241, 0.25); background: rgba(30, 41, 59, 0.7); }
  .vault-result-item.expanded { border-color: rgba(99, 102, 241, 0.35); background: rgba(30, 41, 59, 0.8); }

  .vault-result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .vault-result-source { font-size: 0.85rem; font-weight: 600; color: #a5b4fc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .vault-result-badges { display: flex; gap: 6px; align-items: center; }
  .vault-result-score { padding: 2px 8px; background: rgba(99, 102, 241, 0.15); border-radius: var(--radius-full); font-size: 0.65rem; font-weight: 600; flex-shrink: 0; }
  .vault-result-preview { margin: 0; font-size: 0.8rem; color: #94a3b8; line-height: 1.5; word-break: break-word; }

  .vault-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #64748b; text-align: center; padding: 40px; }
  .vault-empty h3 { margin: 0; font-size: 1.1rem; color: #94a3b8; }
  .vault-empty p { margin: 0; font-size: 0.85rem; }
  .vault-empty-hint { color: #475569; font-size: var(--text-xs); }

  .suggested-queries { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
  .suggested-label { font-size: var(--text-xs); color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
  .suggested-btn {
    padding: 8px 14px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: var(--radius-md); color: #a5b4fc; font-size: var(--text-sm); cursor: pointer;
    transition: all var(--transition-fast); text-align: left;
  }
  .suggested-btn:hover { background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.3); }

  /* === Q&A Section === */
  .qa-section {
    flex-shrink: 0; border-top: 1px solid #334155; padding-top: 16px; display: flex;
    flex-direction: column; gap: 10px; max-height: 300px;
  }

  .qa-header { display: flex; align-items: center; gap: 6px; font-size: var(--text-xs); font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }

  .qa-messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; max-height: 180px; }

  .qa-msg { display: flex; gap: 8px; }
  .qa-avatar { font-size: 14px; flex-shrink: 0; margin-top: 2px; }
  .qa-content { font-size: var(--text-sm); line-height: 1.5; color: #e2e8f0; }
  .qa-msg.user .qa-content { color: #a5b4fc; }

  .qa-typing { display: flex; gap: 4px; align-items: center; padding: 4px 0; }
  .dot { width: 6px; height: 6px; background: #6366f1; border-radius: 50%; animation: qa-bounce 1.4s ease-in-out infinite; }
  .dot:nth-child(2) { animation-delay: 0.16s; }
  .dot:nth-child(3) { animation-delay: 0.32s; }
  @keyframes qa-bounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-4px); opacity: 1; } }

  .qa-suggestions { display: flex; flex-wrap: wrap; gap: 6px; }
  .qa-suggestion-btn {
    padding: 6px 12px; background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.12);
    border-radius: var(--radius-full); color: #94a3b8; font-size: var(--text-xs); cursor: pointer;
    transition: all var(--transition-fast);
  }
  .qa-suggestion-btn:hover { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; border-color: rgba(99, 102, 241, 0.3); }

  .qa-input-row { display: flex; gap: 8px; }
  .qa-input {
    flex: 1; padding: 8px 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid #334155;
    border-radius: var(--radius-md); color: #f1f5f9; font-size: var(--text-sm); outline: none;
    transition: border-color var(--transition-normal); box-sizing: border-box;
  }
  .qa-input::placeholder { color: #64748b; }
  .qa-input:focus { border-color: rgba(99, 102, 241, 0.5); }
  .qa-input:disabled { opacity: 0.5; }
  .qa-send {
    padding: 8px 14px; background: #6366f1; border: none; border-radius: var(--radius-md);
    color: white; font-size: var(--text-sm); font-weight: 500; cursor: pointer;
    transition: all var(--transition-fast); min-height: 38px; display: flex; align-items: center; gap: 6px;
  }
  .qa-send:hover:not(:disabled) { background: #818cf8; }
  .qa-send:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Spinner */
  .spinner { width: 20px; height: 20px; border: 2px solid rgba(99, 102, 241, 0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
  .spinner-sm { width: 14px; height: 14px; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Confirm Dialog */
  .confirm-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; }
  .confirm-dialog { background: #1e293b; border: 1px solid #334155; border-radius: var(--radius-xl); padding: 24px; max-width: 360px; width: 90%; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); }
  .confirm-dialog h3 { margin: 0 0 8px; font-size: 1.1rem; color: #f1f5f9; }
  .confirm-dialog p { margin: 0 0 20px; font-size: 0.85rem; color: #94a3b8; line-height: 1.5; }
  .confirm-actions { display: flex; gap: 8px; justify-content: flex-end; }
  .confirm-btn { padding: 8px 16px; border-radius: var(--radius-md); font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: all var(--transition-normal) var(--transition-easing); border: none; min-height: 44px; }
  .confirm-btn.cancel { background: rgba(99, 102, 241, 0.15); color: #a5b4fc; }
  .confirm-btn.cancel:hover { background: rgba(99, 102, 241, 0.25); }
  .confirm-btn.delete { background: #ef4444; color: white; }
  .confirm-btn.delete:hover { background: #dc2626; }
</style>

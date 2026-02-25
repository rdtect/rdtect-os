<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  interface Note {
    id: string;
    content: string;
    createdAt: number;
    updatedAt: number;
    pinned?: boolean;
  }

  let notes = $state<Note[]>([]);
  let activeNoteId = $state<string | null>(null);
  let searchQuery = $state('');
  let saveTimeout: ReturnType<typeof setTimeout>;

  const activeNote = $derived(notes.find(n => n.id === activeNoteId) ?? null);

  const filteredNotes = $derived.by(() => {
    let filtered = notes;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => n.content.toLowerCase().includes(query));
    }
    return [...filtered].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  });

  function loadNotes(): void {
    if (!browser) return;
    try {
      const stored = localStorage.getItem('desktop-os-notes');
      if (stored) {
        notes = JSON.parse(stored);
        if (notes.length > 0 && !activeNoteId) {
          activeNoteId = notes[0].id;
        }
      }
    } catch {
      // silently fail
    }
  }

  function saveNotes(): void {
    if (!browser) return;
    try {
      localStorage.setItem('desktop-os-notes', JSON.stringify(notes));
    } catch {
      // silently fail
    }
  }

  function debouncedSave(): void {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => saveNotes(), 300);
  }

  function createNote(): void {
    const note: Note = {
      id: `note-${Date.now()}`,
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
    };
    notes = [note, ...notes];
    activeNoteId = note.id;
    saveNotes();
  }

  function deleteNote(id: string): void {
    notes = notes.filter(n => n.id !== id);
    if (activeNoteId === id) {
      activeNoteId = notes[0]?.id ?? null;
    }
    saveNotes();
  }

  function togglePin(id: string): void {
    notes = notes.map(n =>
      n.id === id ? { ...n, pinned: !n.pinned } : n
    );
    saveNotes();
  }

  function updateNoteContent(id: string, content: string): void {
    notes = notes.map(n =>
      n.id === id ? { ...n, content, updatedAt: Date.now() } : n
    );
    debouncedSave();
  }

  function selectNote(id: string): void {
    activeNoteId = id;
  }

  function getNoteTitle(content: string): string {
    const firstLine = content.split('\n')[0].trim();
    return firstLine || 'Untitled Note';
  }

  function getNotePreview(content: string): string {
    const lines = content.split('\n').filter(l => l.trim());
    const preview = lines.slice(1, 3).join(' ').substring(0, 60);
    return preview || 'No additional text';
  }

  function formatDate(timestamp: number): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  onMount(() => {
    loadNotes();
    return () => {
      clearTimeout(saveTimeout);
      saveNotes();
    };
  });
</script>

<div class="notes-root">
  <!-- Sidebar -->
  <div class="notes-sidebar">
    <div class="sidebar-header">
      <h3 class="sidebar-title">Notes</h3>
      <button class="icon-btn" onclick={() => createNote()} title="New Note">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>

    <div class="search-container">
      <input
        type="text"
        class="search-input"
        placeholder="Search notes..."
        bind:value={searchQuery}
      />
    </div>

    <div class="notes-list">
      {#if filteredNotes.length === 0}
        <div class="list-empty">
          {searchQuery ? 'No notes found' : 'No notes yet'}
        </div>
      {:else}
        {#each filteredNotes as note (note.id)}
          <button
            class="note-item"
            class:active={note.id === activeNoteId}
            class:pinned={note.pinned}
            onclick={() => selectNote(note.id)}
          >
            <div class="note-title">{getNoteTitle(note.content)}</div>
            <div class="note-meta">
              <span class="note-date">{formatDate(note.updatedAt)}</span>
              <span class="note-preview">{getNotePreview(note.content)}</span>
            </div>
          </button>
        {/each}
      {/if}
    </div>

    <div class="notes-count">{notes.length} note{notes.length !== 1 ? 's' : ''}</div>
  </div>

  <!-- Editor -->
  <div class="notes-editor">
    {#if activeNote}
      <div class="editor-header">
        <span class="editor-date">Last edited {formatDate(activeNote.updatedAt)}</span>
        <div class="editor-actions">
          <button
            class="action-btn"
            class:active={activeNote.pinned}
            onclick={() => togglePin(activeNote.id)}
            title={activeNote.pinned ? 'Unpin' : 'Pin'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill={activeNote.pinned ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2">
              <path d="M12 2L12 22M12 2L8 6M12 2L16 6"/>
            </svg>
            {activeNote.pinned ? 'Pinned' : 'Pin'}
          </button>
          <button
            class="action-btn danger"
            onclick={() => deleteNote(activeNote.id)}
            title="Delete note"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
            Delete
          </button>
        </div>
      </div>
      <textarea
        class="editor-textarea"
        value={activeNote.content}
        oninput={(e) => updateNoteContent(activeNote.id, (e.target as HTMLTextAreaElement).value)}
        placeholder="Start writing..."
      ></textarea>
    {:else}
      <div class="editor-empty">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-title">{notes.length === 0 ? 'Create your first note' : 'Select a note to edit'}</div>
        <div class="empty-state-body">{notes.length === 0 ? 'Click the + button to get started' : 'Or create a new one with +'}</div>
      </div>
    {/if}
  </div>
</div>

<style>
  .notes-root {
    display: flex;
    height: 100%;
    font-family: var(--desktop-font-sans);
    background: #0f172a;
    color: #e2e8f0;
  }

  /* Sidebar */
  .notes-sidebar {
    width: 220px;
    background: #1e293b;
    border-right: 1px solid #334155;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .sidebar-header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .sidebar-title {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 700;
    background: linear-gradient(135deg, var(--desktop-accent) 0%, #818cf8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .icon-btn {
    background: rgba(255, 255, 255, 0.08);
    border: none;
    color: #94a3b8;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .icon-btn:hover {
    background: rgba(var(--desktop-accent-rgb), 0.2);
    color: var(--desktop-accent);
  }

  .icon-btn svg {
    width: 16px;
    height: 16px;
  }

  /* Search */
  .search-container {
    padding: 0 16px 12px;
  }

  .search-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 10px 12px;
    color: #e2e8f0;
    font-size: var(--text-sm);
    outline: none;
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .search-input:focus {
    border-color: rgba(var(--desktop-accent-rgb), 0.5);
    background-color: rgba(255, 255, 255, 0.08);
  }

  .search-input::placeholder {
    color: #64748b;
  }

  /* Notes List */
  .notes-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 8px;
  }

  .list-empty {
    padding: 20px;
    font-size: var(--text-sm);
    color: #64748b;
    text-align: center;
  }

  .note-item {
    display: block;
    width: 100%;
    padding: 12px 14px;
    margin-bottom: 4px;
    border-radius: 10px;
    cursor: pointer;
    transition: all var(--transition-fast) var(--transition-easing);
    position: relative;
    background: transparent;
    border: 1px solid transparent;
    text-align: left;
    color: inherit;
  }

  .note-item:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .note-item.active {
    background: linear-gradient(135deg, rgba(var(--desktop-accent-rgb), 0.15) 0%, rgba(129, 140, 248, 0.1) 100%);
    border-color: rgba(var(--desktop-accent-rgb), 0.3);
  }

  .note-item.pinned::before {
    content: '';
    position: absolute;
    top: 8px;
    right: 8px;
    width: 6px;
    height: 6px;
    background: var(--desktop-accent);
    border-radius: 50%;
  }

  .note-title {
    font-size: var(--text-base);
    font-weight: 600;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #f1f5f9;
  }

  .note-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .note-date {
    font-size: var(--text-xs);
    color: #64748b;
    flex-shrink: 0;
  }

  .note-preview {
    font-size: var(--text-sm);
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .notes-count {
    padding: 12px 16px;
    font-size: var(--text-xs);
    color: #64748b;
    text-align: center;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  /* Editor */
  .notes-editor {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #0f172a;
    min-width: 0;
  }

  .editor-header {
    padding: 14px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 0, 0, 0.2);
    flex-shrink: 0;
  }

  .editor-date {
    font-size: var(--text-sm);
    color: #64748b;
  }

  .editor-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #64748b;
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: var(--text-sm);
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .action-btn:hover {
    border-color: rgba(var(--desktop-accent-rgb), 0.5);
    color: var(--desktop-accent);
  }

  .action-btn.active {
    background: rgba(var(--desktop-accent-rgb), 0.15);
    border-color: rgba(var(--desktop-accent-rgb), 0.5);
    color: var(--desktop-accent);
  }

  .action-btn.danger:hover {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.5);
    color: #ef4444;
  }

  .editor-textarea {
    flex: 1;
    background: transparent;
    border: none;
    color: #e2e8f0;
    padding: 20px 24px;
    font-size: 15px;
    line-height: 1.7;
    resize: none;
    outline: none;
    font-family: var(--desktop-font-sans);
  }

  .editor-textarea::placeholder {
    color: #475569;
  }

  .editor-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 40px 24px;
    text-align: center;
  }
</style>

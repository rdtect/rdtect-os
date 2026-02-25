<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  // Props from window manager
  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  // Track if custom element is registered
  let isRegistered = $state(false);

  // Register the custom element on mount (client-side only)
  onMount(() => {
    if (!browser) return;

    // Define the custom element class inline
    if (!customElements.get('notes-widget')) {
      interface Note {
        id: string;
        content: string;
        createdAt: number;
        updatedAt: number;
        pinned?: boolean;
      }

      class NotesElement extends HTMLElement {
        private shadow: ShadowRoot;
        private notes: Note[] = [];
        private activeNoteId: string | null = null;
        private searchQuery: string = '';

        constructor() {
          super();
          this.shadow = this.attachShadow({ mode: 'open' });
          this.loadNotes();
          this.render();
        }

        connectedCallback() {
        }

        disconnectedCallback() {
          this.saveNotes();
        }

        private loadNotes(): void {
          try {
            const stored = localStorage.getItem('desktop-os-notes');
            if (stored) {
              this.notes = JSON.parse(stored);
            }
          } catch (e) {
            console.error('Failed to load notes:', e);
          }
        }

        private saveNotes(): void {
          try {
            localStorage.setItem('desktop-os-notes', JSON.stringify(this.notes));
          } catch (e) {
            console.error('Failed to save notes:', e);
          }
        }

        private createNote(): void {
          const note: Note = {
            id: `note-${Date.now()}`,
            content: '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            pinned: false,
          };
          this.notes.unshift(note);
          this.activeNoteId = note.id;
          this.saveNotes();
          this.render();
        }

        private deleteNote(id: string): void {
          this.notes = this.notes.filter((n) => n.id !== id);
          if (this.activeNoteId === id) {
            this.activeNoteId = this.notes[0]?.id || null;
          }
          this.saveNotes();
          this.render();
        }

        private togglePin(id: string): void {
          const note = this.notes.find((n) => n.id === id);
          if (note) {
            note.pinned = !note.pinned;
            this.saveNotes();
            this.render();
          }
        }

        private updateNote(id: string, content: string): void {
          const note = this.notes.find((n) => n.id === id);
          if (note) {
            note.content = content;
            note.updatedAt = Date.now();
            this.saveNotes();
            // Update sidebar title without full re-render
            const noteItem = this.shadow.querySelector(`[data-id="${id}"] .note-title`);
            if (noteItem) {
              noteItem.textContent = this.getNoteTitle(content);
            }
          }
        }

        private selectNote(id: string): void {
          this.activeNoteId = id;
          this.render();
        }

        private getNoteTitle(content: string): string {
          const firstLine = content.split('\n')[0].trim();
          return firstLine || 'Untitled Note';
        }

        private getNotePreview(content: string): string {
          const lines = content.split('\n').filter(l => l.trim());
          const preview = lines.slice(1, 3).join(' ').substring(0, 60);
          return preview || 'No additional text';
        }

        private formatDate(timestamp: number): string {
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

        private getFilteredNotes(): Note[] {
          let filtered = this.notes;
          if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(n => n.content.toLowerCase().includes(query));
          }
          // Sort: pinned first, then by updatedAt
          return filtered.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.updatedAt - a.updatedAt;
          });
        }

        private render(): void {
          const activeNote = this.notes.find((n) => n.id === this.activeNoteId);
          const filteredNotes = this.getFilteredNotes();

          this.shadow.innerHTML = `
            <style>
              :host {
                display: block;
                height: 100%;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: var(--desktop-bg, #0f172a);
                color: var(--desktop-text, #e2e8f0);
              }

              * {
                box-sizing: border-box;
              }

              .container {
                display: flex;
                height: 100%;
              }

              /* Sidebar */
              .sidebar {
                width: 220px;
                background: var(--desktop-surface, #1e293b);
                border-right: 1px solid var(--desktop-border, #334155);
                display: flex;
                flex-direction: column;
              }

              .sidebar-header {
                padding: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
              }

              .sidebar-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 700;
                background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
              }

              .header-actions {
                display: flex;
                gap: 8px;
              }

              .icon-btn {
                background: rgba(255, 255, 255, 0.08);
                border: none;
                color: #94a3b8;
                width: 32px;
                height: 32px;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
              }

              .icon-btn:hover {
                background: rgba(99, 102, 241, 0.2);
                color: #6366f1;
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
                padding: 10px 12px 10px 36px;
                color: #e2e8f0;
                font-size: 13px;
                outline: none;
                transition: all 0.2s ease;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: 12px center;
              }

              .search-input:focus {
                border-color: rgba(99, 102, 241, 0.5);
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

              .notes-list::-webkit-scrollbar {
                width: 6px;
              }

              .notes-list::-webkit-scrollbar-track {
                background: transparent;
              }

              .notes-list::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
              }

              .note-item {
                padding: 12px 14px;
                margin-bottom: 4px;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.15s ease;
                position: relative;
              }

              .note-item:hover {
                background: rgba(255, 255, 255, 0.06);
              }

              .note-item.active {
                background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(129, 140, 248, 0.1) 100%);
                border: 1px solid rgba(99, 102, 241, 0.3);
              }

              .note-item.pinned::before {
                content: '';
                position: absolute;
                top: 8px;
                right: 8px;
                width: 6px;
                height: 6px;
                background: #6366f1;
                border-radius: 50%;
              }

              .note-title {
                font-size: 14px;
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
                font-size: 11px;
                color: #64748b;
              }

              .note-preview {
                font-size: 12px;
                color: #94a3b8;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                flex: 1;
              }

              .notes-count {
                padding: 12px 16px;
                font-size: 11px;
                color: #64748b;
                text-align: center;
                border-top: 1px solid rgba(255, 255, 255, 0.06);
              }

              /* Editor */
              .editor {
                flex: 1;
                display: flex;
                flex-direction: column;
                background: var(--desktop-bg, #0f172a);
              }

              .editor-header {
                padding: 14px 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(0, 0, 0, 0.2);
              }

              .editor-date {
                font-size: 12px;
                color: #64748b;
              }

              .editor-actions {
                display: flex;
                gap: 8px;
              }

              .pin-btn {
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #64748b;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 6px;
                transition: all 0.2s ease;
              }

              .pin-btn:hover {
                border-color: rgba(99, 102, 241, 0.5);
                color: #6366f1;
              }

              .pin-btn.pinned {
                background: rgba(99, 102, 241, 0.15);
                border-color: rgba(99, 102, 241, 0.5);
                color: #6366f1;
              }

              .delete-btn {
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #64748b;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 6px;
                transition: all 0.2s ease;
              }

              .delete-btn:hover {
                background: rgba(239, 68, 68, 0.15);
                border-color: rgba(239, 68, 68, 0.5);
                color: #ef4444;
              }

              textarea {
                flex: 1;
                background: transparent;
                border: none;
                color: #e2e8f0;
                padding: 20px 24px;
                font-size: 15px;
                line-height: 1.7;
                resize: none;
                outline: none;
                font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }

              textarea::placeholder {
                color: #475569;
              }

              .empty-state {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: #64748b;
                gap: 12px;
              }

              .empty-icon {
                font-size: 48px;
                opacity: 0.5;
              }

              .empty-text {
                font-size: 14px;
              }

              .empty-hint {
                font-size: 12px;
                color: #475569;
              }

              .badge {
                text-align: center;
                padding: 10px;
                font-size: 9px;
                color: #6366f1;
                text-transform: uppercase;
                letter-spacing: 0.15em;
                background: rgba(99, 102, 241, 0.05);
                border-top: 1px solid rgba(255, 255, 255, 0.04);
              }
            </style>

            <div class="container">
              <div class="sidebar">
                <div class="sidebar-header">
                  <h3>Notes</h3>
                  <div class="header-actions">
                    <button class="icon-btn" id="new-note" title="New Note">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="search-container">
                  <input
                    type="text"
                    class="search-input"
                    id="search-input"
                    placeholder="Search notes..."
                    value="${this.searchQuery}"
                  />
                </div>

                <div class="notes-list">
                  ${filteredNotes.length === 0
                    ? `<div class="empty-state" style="padding: 20px;">
                        <span style="font-size: 12px; color: #64748b;">
                          ${this.searchQuery ? 'No notes found' : 'No notes yet'}
                        </span>
                       </div>`
                    : filteredNotes.map((note) => `
                        <div class="note-item ${note.id === this.activeNoteId ? 'active' : ''} ${note.pinned ? 'pinned' : ''}" data-id="${note.id}">
                          <div class="note-title">${this.getNoteTitle(note.content)}</div>
                          <div class="note-meta">
                            <span class="note-date">${this.formatDate(note.updatedAt)}</span>
                            <span class="note-preview">${this.getNotePreview(note.content)}</span>
                          </div>
                        </div>
                      `).join('')
                  }
                </div>

                <div class="notes-count">${this.notes.length} note${this.notes.length !== 1 ? 's' : ''}</div>
              </div>

              <div class="editor">
                ${activeNote ? `
                  <div class="editor-header">
                    <span class="editor-date">Last edited ${this.formatDate(activeNote.updatedAt)}</span>
                    <div class="editor-actions">
                      <button class="pin-btn ${activeNote.pinned ? 'pinned' : ''}" id="pin-note" title="${activeNote.pinned ? 'Unpin' : 'Pin'} note">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="${activeNote.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                          <path d="M12 2L12 22M12 2L8 6M12 2L16 6"/>
                        </svg>
                        ${activeNote.pinned ? 'Pinned' : 'Pin'}
                      </button>
                      <button class="delete-btn" id="delete-note" title="Delete note">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                  <textarea id="note-content" placeholder="Start writing...">${activeNote.content}</textarea>
                ` : `
                  <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <div class="empty-text">${this.notes.length === 0 ? 'Create your first note' : 'Select a note to edit'}</div>
                    <div class="empty-hint">${this.notes.length === 0 ? 'Click the + button to get started' : 'Or create a new one with +'}</div>
                  </div>
                `}
              </div>
            </div>

          `;

          // Attach event listeners
          this.shadow.getElementById('new-note')?.addEventListener('click', () => this.createNote());
          this.shadow.getElementById('delete-note')?.addEventListener('click', () => {
            if (this.activeNoteId) this.deleteNote(this.activeNoteId);
          });
          this.shadow.getElementById('pin-note')?.addEventListener('click', () => {
            if (this.activeNoteId) this.togglePin(this.activeNoteId);
          });

          const searchInput = this.shadow.getElementById('search-input') as HTMLInputElement;
          if (searchInput) {
            searchInput.addEventListener('input', (e) => {
              this.searchQuery = (e.target as HTMLInputElement).value;
              this.render();
            });
          }

          this.shadow.querySelectorAll('.note-item').forEach((el) => {
            el.addEventListener('click', () => {
              const id = (el as HTMLElement).dataset.id;
              if (id) this.selectNote(id);
            });
          });

          const textarea = this.shadow.getElementById('note-content') as HTMLTextAreaElement;
          if (textarea) {
            textarea.addEventListener('input', () => {
              if (this.activeNoteId) {
                this.updateNote(this.activeNoteId, textarea.value);
              }
            });
            textarea.focus();
            textarea.selectionStart = textarea.value.length;
          }
        }
      }

      customElements.define('notes-widget', NotesElement);
    }
    isRegistered = true;
  });
</script>

<div class="notes-container">
  {#if isRegistered}
    <notes-widget window-id={windowId}></notes-widget>
  {:else}
    <div class="loading">Loading Notes...</div>
  {/if}
</div>

<style>
  .notes-container {
    width: 100%;
    height: 100%;
    --desktop-bg: #0f172a;
    --desktop-surface: #1e293b;
    --desktop-border: #334155;
    --desktop-accent: #6366f1;
    --desktop-text: #e2e8f0;
    --desktop-text-muted: #64748b;
  }

  notes-widget {
    display: block;
    width: 100%;
    height: 100%;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #64748b;
  }
</style>

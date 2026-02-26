<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  // === Types ===
  interface KanbanCard {
    id: string;
    title: string;
    description: string;
    createdAt: number;
  }

  interface Column {
    id: string;
    name: string;
    color: string;
    cards: KanbanCard[];
  }

  const STORAGE_KEY = 'desktop-os-kanban';

  // === State ===
  let columns = $state<Column[]>([
    { id: 'todo', name: 'Todo', color: '#6366f1', cards: [] },
    { id: 'in-progress', name: 'In Progress', color: '#f59e0b', cards: [] },
    { id: 'done', name: 'Done', color: '#22c55e', cards: [] },
  ]);

  let draggedCardId = $state<string | null>(null);
  let draggedFromCol = $state<string | null>(null);
  let dragOverCol = $state<string | null>(null);
  let newCardTitle = $state('');
  let newCardDesc = $state('');
  let addingToCol = $state<string | null>(null);

  const totalCards = $derived(columns.reduce((sum, col) => sum + col.cards.length, 0));

  // === Persistence ===
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
    } catch {
      // silent fail
    }
  }

  function loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          columns = parsed;
        }
      }
    } catch {
      // use defaults
    }
  }

  // === Actions ===
  function addCard(columnId: string) {
    if (!newCardTitle.trim()) return;

    const card: KanbanCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: newCardTitle.trim(),
      description: newCardDesc.trim(),
      createdAt: Date.now(),
    };

    columns = columns.map(col =>
      col.id === columnId
        ? { ...col, cards: [...col.cards, card] }
        : col
    );

    newCardTitle = '';
    newCardDesc = '';
    addingToCol = null;
    saveToStorage();
  }

  function deleteCard(columnId: string, cardId: string) {
    columns = columns.map(col =>
      col.id === columnId
        ? { ...col, cards: col.cards.filter(c => c.id !== cardId) }
        : col
    );
    saveToStorage();
  }

  // === Drag & Drop ===
  function onDragStart(cardId: string, fromCol: string) {
    draggedCardId = cardId;
    draggedFromCol = fromCol;
  }

  function onDragOver(e: DragEvent, colId: string) {
    e.preventDefault();
    dragOverCol = colId;
  }

  function onDragLeave() {
    dragOverCol = null;
  }

  function onDrop(toColId: string) {
    if (!draggedCardId || !draggedFromCol) return;

    const sourceCol = columns.find(c => c.id === draggedFromCol);
    const card = sourceCol?.cards.find(c => c.id === draggedCardId);
    if (!card) return;

    columns = columns.map(col => {
      if (col.id === draggedFromCol) {
        return { ...col, cards: col.cards.filter(c => c.id !== draggedCardId) };
      }
      if (col.id === toColId) {
        return { ...col, cards: [...col.cards, card] };
      }
      return col;
    });

    draggedCardId = null;
    draggedFromCol = null;
    dragOverCol = null;
    saveToStorage();
  }

  function onDragEnd() {
    draggedCardId = null;
    draggedFromCol = null;
    dragOverCol = null;
  }

  function startAdding(colId: string) {
    addingToCol = colId;
    newCardTitle = '';
    newCardDesc = '';
  }

  function cancelAdding() {
    addingToCol = null;
    newCardTitle = '';
    newCardDesc = '';
  }

  function handleAddKeydown(e: KeyboardEvent, colId: string) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addCard(colId);
    }
    if (e.key === 'Escape') {
      cancelAdding();
    }
  }

  onMount(() => {
    loadFromStorage();
  });
</script>

<div class="kanban">
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h3>Kanban Board</h3>
      <span class="card-count">{totalCards} cards</span>
    </div>
  </div>

  <!-- Board -->
  <div class="board">
    {#each columns as col}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="column"
        class:drag-over={dragOverCol === col.id}
        ondragover={(e: DragEvent) => onDragOver(e, col.id)}
        ondragleave={onDragLeave}
        ondrop={() => onDrop(col.id)}
      >
        <!-- Column Header -->
        <div class="col-header">
          <div class="col-header-left">
            <span class="col-dot" style="background:{col.color}"></span>
            <span class="col-name">{col.name}</span>
            <span class="col-count">{col.cards.length}</span>
          </div>
          <button class="add-btn" onclick={() => startAdding(col.id)} title="Add card">+</button>
        </div>

        <!-- Cards -->
        <div class="col-body">
          {#each col.cards as card (card.id)}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="card"
              class:dragging={draggedCardId === card.id}
              draggable="true"
              ondragstart={() => onDragStart(card.id, col.id)}
              ondragend={onDragEnd}
            >
              <div class="card-header">
                <span class="card-title">{card.title}</span>
                <button class="card-delete" onclick={() => deleteCard(col.id, card.id)} title="Delete">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              {#if card.description}
                <p class="card-desc">{card.description}</p>
              {/if}
            </div>
          {/each}

          <!-- Add Card Form -->
          {#if addingToCol === col.id}
            <div class="add-form">
              <input
                type="text"
                class="add-input"
                placeholder="Card title..."
                bind:value={newCardTitle}
                onkeydown={(e: KeyboardEvent) => handleAddKeydown(e, col.id)}
              />
              <textarea
                class="add-textarea"
                placeholder="Description (optional)"
                bind:value={newCardDesc}
                rows="2"
              ></textarea>
              <div class="add-actions">
                <button class="action-btn save" onclick={() => addCard(col.id)}>Add</button>
                <button class="action-btn cancel" onclick={cancelAdding}>Cancel</button>
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .kanban {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f172a;
    font-family: var(--desktop-font-sans);
    overflow: hidden;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid #334155;
    background: #1e293b;
    flex-shrink: 0;
  }
  .header-left { display: flex; align-items: center; gap: 12px; }
  h3 { margin: 0; font-size: 14px; color: #f1f5f9; font-weight: 600; }
  .card-count { font-size: 11px; color: #64748b; }

  /* Board */
  .board {
    display: flex;
    gap: 12px;
    padding: 12px;
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .board::-webkit-scrollbar { height: var(--scrollbar-width); }
  .board::-webkit-scrollbar-track { background: transparent; }
  .board::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: var(--radius-full); }

  /* Column */
  .column {
    display: flex;
    flex-direction: column;
    min-width: 220px;
    flex: 1;
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: var(--radius-lg);
    transition: border-color 0.15s, background 0.15s;
  }
  .column.drag-over {
    border-color: rgba(99, 102, 241, 0.4);
    background: rgba(99, 102, 241, 0.05);
  }

  .col-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(51, 65, 85, 0.3);
    flex-shrink: 0;
  }
  .col-header-left { display: flex; align-items: center; gap: 8px; }
  .col-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .col-name { font-size: 12px; font-weight: 600; color: #e2e8f0; }
  .col-count {
    font-size: 10px; color: #64748b;
    background: rgba(51, 65, 85, 0.5);
    padding: 1px 6px;
    border-radius: 8px;
  }
  .add-btn {
    width: 22px; height: 22px;
    display: flex; align-items: center; justify-content: center;
    background: transparent; border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: var(--radius-sm); color: #64748b;
    font-size: 14px; cursor: pointer; transition: all 0.15s;
  }
  .add-btn:hover { background: rgba(99, 102, 241, 0.15); border-color: rgba(99, 102, 241, 0.3); color: #a5b4fc; }

  /* Column Body */
  .col-body {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .col-body::-webkit-scrollbar { width: 3px; }
  .col-body::-webkit-scrollbar-track { background: transparent; }
  .col-body::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 3px; }

  /* Card */
  .card {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: var(--radius-md);
    padding: 10px;
    cursor: grab;
    transition: all 0.15s;
  }
  .card:hover { border-color: rgba(99, 102, 241, 0.3); background: rgba(15, 23, 42, 0.8); }
  .card.dragging { opacity: 0.4; }

  .card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
  .card-title { font-size: 12px; font-weight: 500; color: #e2e8f0; line-height: 1.4; flex: 1; }
  .card-delete {
    width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;
    background: transparent; border: none; color: #64748b;
    cursor: pointer; opacity: 0; transition: all 0.15s; flex-shrink: 0;
    border-radius: 3px;
  }
  .card:hover .card-delete { opacity: 1; }
  .card-delete:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

  .card-desc {
    margin: 6px 0 0;
    font-size: 11px;
    color: #94a3b8;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Add Form */
  .add-form {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: var(--radius-md);
  }
  .add-input, .add-textarea {
    width: 100%;
    padding: 6px 8px;
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: var(--radius-sm);
    color: #e2e8f0;
    font-size: 12px;
    font-family: var(--desktop-font-sans);
    outline: none;
    box-sizing: border-box;
    resize: none;
  }
  .add-input:focus, .add-textarea:focus {
    border-color: rgba(99, 102, 241, 0.4);
  }
  .add-input::placeholder, .add-textarea::placeholder { color: #64748b; }
  .add-actions { display: flex; gap: 4px; }
  .action-btn {
    padding: 4px 12px;
    border: none;
    border-radius: var(--radius-sm);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .action-btn.save { background: rgba(99, 102, 241, 0.8); color: white; }
  .action-btn.save:hover { background: rgba(99, 102, 241, 1); }
  .action-btn.cancel { background: transparent; color: #94a3b8; }
  .action-btn.cancel:hover { color: #e2e8f0; }
</style>

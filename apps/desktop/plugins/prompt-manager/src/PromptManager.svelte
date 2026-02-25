<script lang="ts">
  /**
   * Prompt Manager - Native Component
   *
   * Manage and organize AI prompts with categories and favorites.
   */
  import { onMount } from "svelte";

  interface Prompt {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    isFavorite: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  let prompts = $state<Prompt[]>([]);
  let categories = $state<string[]>(["General", "Code", "Writing", "Analysis"]);
  let selectedCategory = $state<string | null>(null);
  let searchQuery = $state("");
  let editingPrompt = $state<Prompt | null>(null);
  let isCreating = $state(false);

  // Form state
  let formTitle = $state("");
  let formContent = $state("");
  let formCategory = $state("General");
  let formTags = $state("");

  const STORAGE_KEY = "rdtect-os-prompts";

  onMount(() => {
    loadPrompts();
  });

  function loadPrompts() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        prompts = parsed.map((p: Prompt) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }));
      } else {
        // Add some default prompts
        prompts = getDefaultPrompts();
        savePrompts();
      }
    } catch (e) {
      console.error("Failed to load prompts:", e);
      prompts = getDefaultPrompts();
    }
  }

  function savePrompts() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
    } catch (e) {
      console.error("Failed to save prompts:", e);
    }
  }

  function getDefaultPrompts(): Prompt[] {
    const now = new Date();
    return [
      {
        id: crypto.randomUUID(),
        title: "Code Review",
        content: "Please review this code for:\n- Best practices\n- Performance issues\n- Security vulnerabilities\n- Code readability",
        category: "Code",
        tags: ["review", "best-practices"],
        isFavorite: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        title: "Explain Like I'm 5",
        content: "Explain the following concept in simple terms that a 5-year-old could understand:\n\n[TOPIC]",
        category: "General",
        tags: ["explain", "simple"],
        isFavorite: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: crypto.randomUUID(),
        title: "Blog Post Outline",
        content: "Create an outline for a blog post about:\n\nTopic: [TOPIC]\nTarget audience: [AUDIENCE]\nKey points to cover:\n- Introduction\n- Main sections\n- Conclusion with call to action",
        category: "Writing",
        tags: ["blog", "outline"],
        isFavorite: false,
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  function filteredPrompts() {
    return prompts.filter(p => {
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      const matchesSearch = !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }

  function startCreate() {
    isCreating = true;
    editingPrompt = null;
    formTitle = "";
    formContent = "";
    formCategory = "General";
    formTags = "";
  }

  function startEdit(prompt: Prompt) {
    isCreating = false;
    editingPrompt = prompt;
    formTitle = prompt.title;
    formContent = prompt.content;
    formCategory = prompt.category;
    formTags = prompt.tags.join(", ");
  }

  function cancelEdit() {
    editingPrompt = null;
    isCreating = false;
  }

  function savePrompt() {
    const tags = formTags.split(",").map(t => t.trim()).filter(Boolean);
    const now = new Date();

    if (isCreating) {
      const newPrompt: Prompt = {
        id: crypto.randomUUID(),
        title: formTitle,
        content: formContent,
        category: formCategory,
        tags,
        isFavorite: false,
        createdAt: now,
        updatedAt: now
      };
      prompts = [newPrompt, ...prompts];
    } else if (editingPrompt) {
      prompts = prompts.map(p =>
        p.id === editingPrompt!.id
          ? { ...p, title: formTitle, content: formContent, category: formCategory, tags, updatedAt: now }
          : p
      );
    }

    savePrompts();
    cancelEdit();
  }

  function deletePrompt(id: string) {
    if (confirm("Delete this prompt?")) {
      prompts = prompts.filter(p => p.id !== id);
      savePrompts();
    }
  }

  function toggleFavorite(id: string) {
    prompts = prompts.map(p =>
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    );
    savePrompts();
  }

  function copyToClipboard(content: string) {
    navigator.clipboard.writeText(content);
  }
</script>

<div class="prompt-manager">
  <!-- Header -->
  <header class="header">
    <div class="header-left">
      <span class="icon">📝</span>
      <h2>Prompt Manager</h2>
    </div>
    <button onclick={startCreate} class="new-btn">+ New Prompt</button>
  </header>

  <!-- Search and Filter -->
  <div class="filters">
    <input
      type="text"
      placeholder="Search prompts..."
      bind:value={searchQuery}
      class="search-input"
    />
    <div class="categories">
      <button
        class="category-btn"
        class:active={!selectedCategory}
        onclick={() => selectedCategory = null}
      >
        All
      </button>
      {#each categories as cat}
        <button
          class="category-btn"
          class:active={selectedCategory === cat}
          onclick={() => selectedCategory = cat}
        >
          {cat}
        </button>
      {/each}
    </div>
  </div>

  <!-- Content -->
  <div class="content">
    {#if isCreating || editingPrompt}
      <!-- Edit Form -->
      <div class="edit-form">
        <h3>{isCreating ? "Create New Prompt" : "Edit Prompt"}</h3>
        <input
          type="text"
          placeholder="Title"
          bind:value={formTitle}
          class="form-input"
        />
        <select bind:value={formCategory} class="form-select">
          {#each categories as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>
        <textarea
          placeholder="Prompt content..."
          bind:value={formContent}
          class="form-textarea"
          rows="8"
        ></textarea>
        <input
          type="text"
          placeholder="Tags (comma separated)"
          bind:value={formTags}
          class="form-input"
        />
        <div class="form-actions">
          <button onclick={cancelEdit} class="cancel-btn">Cancel</button>
          <button onclick={savePrompt} class="save-btn" disabled={!formTitle || !formContent}>
            Save
          </button>
        </div>
      </div>
    {:else}
      <!-- Prompts List -->
      <div class="prompts-list">
        {#each filteredPrompts() as prompt (prompt.id)}
          <div class="prompt-card">
            <div class="prompt-header">
              <button
                class="favorite-btn"
                class:active={prompt.isFavorite}
                onclick={() => toggleFavorite(prompt.id)}
              >
                {prompt.isFavorite ? "★" : "☆"}
              </button>
              <h4 class="prompt-title">{prompt.title}</h4>
              <span class="prompt-category">{prompt.category}</span>
            </div>
            <p class="prompt-content">{prompt.content}</p>
            {#if prompt.tags.length > 0}
              <div class="prompt-tags">
                {#each prompt.tags as tag}
                  <span class="tag">{tag}</span>
                {/each}
              </div>
            {/if}
            <div class="prompt-actions">
              <button onclick={() => copyToClipboard(prompt.content)} class="action-btn">
                📋 Copy
              </button>
              <button onclick={() => startEdit(prompt)} class="action-btn">
                ✏️ Edit
              </button>
              <button onclick={() => deletePrompt(prompt.id)} class="action-btn delete">
                🗑️ Delete
              </button>
            </div>
          </div>
        {:else}
          <div class="empty-state">
            <span class="empty-icon">📝</span>
            <p>No prompts found</p>
            <button onclick={startCreate} class="new-btn">Create your first prompt</button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .prompt-manager {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: rgba(15, 23, 42, 0.95);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(51, 65, 85, 0.6);
    background: rgba(30, 41, 59, 0.8);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .icon {
    font-size: 20px;
  }

  .header h2 {
    font-size: 15px;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0;
  }

  .new-btn {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
  }

  .new-btn:hover {
    background: linear-gradient(135deg, #4f46e5, #4338ca);
  }

  .filters {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(51, 65, 85, 0.4);
    background: rgba(30, 41, 59, 0.4);
  }

  .search-input {
    width: 100%;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: 8px;
    padding: 8px 12px;
    color: #f1f5f9;
    font-size: 13px;
    margin-bottom: 10px;
  }

  .search-input::placeholder {
    color: #64748b;
  }

  .categories {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .category-btn {
    background: rgba(51, 65, 85, 0.4);
    border: 1px solid rgba(71, 85, 105, 0.3);
    border-radius: 14px;
    padding: 4px 10px;
    color: #94a3b8;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .category-btn:hover {
    background: rgba(99, 102, 241, 0.2);
  }

  .category-btn.active {
    background: rgba(99, 102, 241, 0.4);
    border-color: rgba(99, 102, 241, 0.5);
    color: #c7d2fe;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .prompts-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .prompt-card {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: 10px;
    padding: 14px;
  }

  .prompt-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .favorite-btn {
    background: none;
    border: none;
    color: #64748b;
    font-size: 16px;
    cursor: pointer;
    padding: 0;
  }

  .favorite-btn.active {
    color: #fbbf24;
  }

  .prompt-title {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0;
  }

  .prompt-category {
    font-size: 10px;
    background: rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
    padding: 2px 8px;
    border-radius: 10px;
  }

  .prompt-content {
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.5;
    margin: 0 0 10px 0;
    white-space: pre-wrap;
    max-height: 80px;
    overflow: hidden;
  }

  .prompt-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }

  .tag {
    font-size: 10px;
    background: rgba(51, 65, 85, 0.5);
    color: #94a3b8;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .prompt-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    background: rgba(51, 65, 85, 0.4);
    border: none;
    color: #94a3b8;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:hover {
    background: rgba(99, 102, 241, 0.3);
    color: #c7d2fe;
  }

  .action-btn.delete:hover {
    background: rgba(239, 68, 68, 0.3);
    color: #fca5a5;
  }

  .edit-form {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: 10px;
    padding: 16px;
  }

  .edit-form h3 {
    font-size: 14px;
    color: #f1f5f9;
    margin: 0 0 12px 0;
  }

  .form-input,
  .form-select,
  .form-textarea {
    width: 100%;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: 6px;
    padding: 8px 12px;
    color: #f1f5f9;
    font-size: 13px;
    margin-bottom: 10px;
    font-family: inherit;
  }

  .form-textarea {
    resize: vertical;
    min-height: 100px;
  }

  .form-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  .cancel-btn {
    background: rgba(51, 65, 85, 0.5);
    border: none;
    color: #94a3b8;
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
  }

  .save-btn {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    color: white;
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
  }

  .save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #64748b;
    text-align: center;
  }

  .empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
  }
</style>

<script lang="ts">
  interface PromptVariable {
    name: string;
    defaultValue: string;
    description: string;
  }

  interface Prompt {
    id: string;
    title: string;
    template: string;
    variables: PromptVariable[];
    category: string;
    tags: string[];
    isFavorite: boolean;
    createdAt: number;
    updatedAt: number;
  }

  interface VariableValues {
    [key: string]: string;
  }

  const STORAGE_KEY = 'desktop-os-prompts';
  const CATEGORIES = ['General', 'Coding', 'Writing', 'Analysis', 'Creative', 'Business', 'Custom'];

  // State
  let prompts = $state<Prompt[]>([]);
  let searchQuery = $state('');
  let selectedCategory = $state('All');
  let showFavoritesOnly = $state(false);
  let editingPrompt = $state<Prompt | null>(null);
  let isCreating = $state(false);
  let previewVariables = $state<VariableValues>({});
  let activeTab = $state<'list' | 'edit' | 'preview'>('list');

  // Form state
  let formTitle = $state('');
  let formTemplate = $state('');
  let formCategory = $state('General');
  let formTags = $state('');
  let formVariables = $state<PromptVariable[]>([]);

  // Derived
  let filteredPrompts = $derived.by(() => {
    let result = prompts;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.template.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (showFavoritesOnly) {
      result = result.filter(p => p.isFavorite);
    }

    return result.sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  });

  let extractedVariables = $derived.by(() => {
    const regex = /\{\{(\w+)\}\}/g;
    const vars: string[] = [];
    let match;
    while ((match = regex.exec(formTemplate)) !== null) {
      if (!vars.includes(match[1])) {
        vars.push(match[1]);
      }
    }
    return vars;
  });

  let previewText = $derived.by(() => {
    let text = editingPrompt?.template || formTemplate;
    const vars = editingPrompt?.variables || formVariables;

    for (const v of vars) {
      const value = previewVariables[v.name] || v.defaultValue || `{{${v.name}}}`;
      text = text.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), value);
    }

    return text;
  });

  let allCategories = $derived(['All', ...CATEGORIES]);

  // Load from localStorage
  $effect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        prompts = JSON.parse(stored);
      } catch {
        prompts = [];
      }
    }
  });

  // Save to localStorage
  $effect(() => {
    if (prompts.length > 0 || localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
    }
  });

  // Sync form variables with extracted
  $effect(() => {
    if (isCreating || editingPrompt) {
      const existing = new Map(formVariables.map(v => [v.name, v]));
      formVariables = extractedVariables.map(name =>
        existing.get(name) || { name, defaultValue: '', description: '' }
      );
    }
  });

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  function startCreate() {
    isCreating = true;
    editingPrompt = null;
    formTitle = '';
    formTemplate = '';
    formCategory = 'General';
    formTags = '';
    formVariables = [];
    previewVariables = {};
    activeTab = 'edit';
  }

  function startEdit(prompt: Prompt) {
    isCreating = false;
    editingPrompt = prompt;
    formTitle = prompt.title;
    formTemplate = prompt.template;
    formCategory = prompt.category;
    formTags = prompt.tags.join(', ');
    formVariables = [...prompt.variables];
    previewVariables = Object.fromEntries(
      prompt.variables.map(v => [v.name, v.defaultValue])
    );
    activeTab = 'edit';
  }

  function savePrompt() {
    if (!formTitle.trim() || !formTemplate.trim()) return;

    const now = Date.now();
    const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);

    if (editingPrompt) {
      prompts = prompts.map(p =>
        p.id === editingPrompt!.id
          ? {
              ...p,
              title: formTitle,
              template: formTemplate,
              variables: formVariables,
              category: formCategory,
              tags,
              updatedAt: now
            }
          : p
      );
    } else {
      const newPrompt: Prompt = {
        id: generateId(),
        title: formTitle,
        template: formTemplate,
        variables: formVariables,
        category: formCategory,
        tags,
        isFavorite: false,
        createdAt: now,
        updatedAt: now
      };
      prompts = [newPrompt, ...prompts];
    }

    cancelEdit();
  }

  function cancelEdit() {
    isCreating = false;
    editingPrompt = null;
    activeTab = 'list';
  }

  function deletePrompt(id: string) {
    if (confirm('Are you sure you want to delete this prompt?')) {
      prompts = prompts.filter(p => p.id !== id);
      if (editingPrompt?.id === id) {
        cancelEdit();
      }
    }
  }

  function toggleFavorite(id: string) {
    prompts = prompts.map(p =>
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    );
  }

  function duplicatePrompt(prompt: Prompt) {
    const newPrompt: Prompt = {
      ...prompt,
      id: generateId(),
      title: `${prompt.title} (Copy)`,
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    prompts = [newPrompt, ...prompts];
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  function exportPrompts() {
    const data = JSON.stringify(prompts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importPrompts(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as Prompt[];
        const newPrompts = imported.map(p => ({
          ...p,
          id: generateId(),
          createdAt: Date.now(),
          updatedAt: Date.now()
        }));
        prompts = [...newPrompts, ...prompts];
        alert(`Imported ${newPrompts.length} prompts successfully!`);
      } catch {
        alert('Failed to import prompts. Invalid file format.');
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  function updateVariableValue(name: string, value: string) {
    previewVariables = { ...previewVariables, [name]: value };
  }

  function updateVariableDefault(index: number, value: string) {
    formVariables = formVariables.map((v, i) =>
      i === index ? { ...v, defaultValue: value } : v
    );
  }

  function updateVariableDescription(index: number, value: string) {
    formVariables = formVariables.map((v, i) =>
      i === index ? { ...v, description: value } : v
    );
  }
</script>

<div class="prompt-manager">
  <header class="header">
    <h1>Prompt Manager</h1>
    <div class="header-actions">
      <button class="btn btn-primary" onclick={startCreate}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        New Prompt
      </button>
      <button class="btn btn-secondary" onclick={exportPrompts}>Export</button>
      <label class="btn btn-secondary">
        Import
        <input type="file" accept=".json" onchange={importPrompts} hidden />
      </label>
    </div>
  </header>

  {#if activeTab === 'list'}
    <div class="toolbar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          placeholder="Search prompts..."
          bind:value={searchQuery}
        />
      </div>

      <div class="filters">
        <select bind:value={selectedCategory}>
          {#each allCategories as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>

        <label class="checkbox-label">
          <input type="checkbox" bind:checked={showFavoritesOnly} />
          <span>Favorites only</span>
        </label>
      </div>
    </div>

    <div class="prompts-list">
      {#if filteredPrompts.length === 0}
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p>No prompts found</p>
          <button class="btn btn-primary" onclick={startCreate}>Create your first prompt</button>
        </div>
      {:else}
        {#each filteredPrompts as prompt (prompt.id)}
          <div class="prompt-card">
            <div class="prompt-header">
              <button
                class="favorite-btn"
                class:active={prompt.isFavorite}
                onclick={() => toggleFavorite(prompt.id)}
              >
                <svg viewBox="0 0 24 24" fill={prompt.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </button>
              <h3>{prompt.title}</h3>
              <span class="category-badge">{prompt.category}</span>
            </div>

            <p class="prompt-preview">{prompt.template.slice(0, 150)}{prompt.template.length > 150 ? '...' : ''}</p>

            {#if prompt.tags.length > 0}
              <div class="tags">
                {#each prompt.tags as tag}
                  <span class="tag">{tag}</span>
                {/each}
              </div>
            {/if}

            {#if prompt.variables.length > 0}
              <div class="variables-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                {prompt.variables.length} variable{prompt.variables.length !== 1 ? 's' : ''}
              </div>
            {/if}

            <div class="prompt-actions">
              <button class="btn btn-icon" title="Edit" onclick={() => startEdit(prompt)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="btn btn-icon" title="Duplicate" onclick={() => duplicatePrompt(prompt)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                </svg>
              </button>
              <button class="btn btn-icon" title="Copy" onclick={() => copyToClipboard(prompt.template)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
              </button>
              <button class="btn btn-icon btn-danger" title="Delete" onclick={() => deletePrompt(prompt.id)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {:else}
    <div class="edit-container">
      <div class="edit-tabs">
        <button
          class="tab"
          class:active={activeTab === 'edit'}
          onclick={() => activeTab = 'edit'}
        >Edit</button>
        <button
          class="tab"
          class:active={activeTab === 'preview'}
          onclick={() => activeTab = 'preview'}
        >Preview</button>
      </div>

      {#if activeTab === 'edit'}
        <div class="edit-form">
          <div class="form-group">
            <label for="title">Title</label>
            <input
              id="title"
              type="text"
              placeholder="Enter prompt title..."
              bind:value={formTitle}
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="category">Category</label>
              <select id="category" bind:value={formCategory}>
                {#each CATEGORIES as cat}
                  <option value={cat}>{cat}</option>
                {/each}
              </select>
            </div>

            <div class="form-group">
              <label for="tags">Tags (comma-separated)</label>
              <input
                id="tags"
                type="text"
                placeholder="e.g. coding, python, debug"
                bind:value={formTags}
              />
            </div>
          </div>

          <div class="form-group">
            <label for="template">
              Template
              <span class="hint">Use {'{{variableName}}'} for variables</span>
            </label>
            <textarea
              id="template"
              placeholder="Enter your prompt template..."
              bind:value={formTemplate}
              rows="8"
            ></textarea>
          </div>

          {#if formVariables.length > 0}
            <div class="variables-section">
              <h4>Variables</h4>
              {#each formVariables as variable, i (variable.name)}
                <div class="variable-config">
                  <div class="variable-name">{`{{${variable.name}}}`}</div>
                  <input
                    type="text"
                    placeholder="Default value"
                    value={variable.defaultValue}
                    oninput={(e) => updateVariableDefault(i, (e.target as HTMLInputElement).value)}
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={variable.description}
                    oninput={(e) => updateVariableDescription(i, (e.target as HTMLInputElement).value)}
                  />
                </div>
              {/each}
            </div>
          {/if}

          <div class="form-actions">
            <button class="btn btn-secondary" onclick={cancelEdit}>Cancel</button>
            <button class="btn btn-primary" onclick={savePrompt}>
              {editingPrompt ? 'Save Changes' : 'Create Prompt'}
            </button>
          </div>
        </div>
      {:else}
        <div class="preview-section">
          {#if formVariables.length > 0}
            <div class="preview-variables">
              <h4>Fill in Variables</h4>
              {#each formVariables as variable (variable.name)}
                <div class="preview-variable-input">
                  <label for={`var-${variable.name}`}>
                    {variable.name}
                    {#if variable.description}
                      <span class="var-desc">{variable.description}</span>
                    {/if}
                  </label>
                  <input
                    id={`var-${variable.name}`}
                    type="text"
                    placeholder={variable.defaultValue || `Enter ${variable.name}...`}
                    value={previewVariables[variable.name] || ''}
                    oninput={(e) => updateVariableValue(variable.name, (e.target as HTMLInputElement).value)}
                  />
                </div>
              {/each}
            </div>
          {/if}

          <div class="preview-output">
            <div class="preview-header">
              <h4>Preview</h4>
              <button class="btn btn-icon" title="Copy" onclick={() => copyToClipboard(previewText)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
              </button>
            </div>
            <pre class="preview-text">{previewText}</pre>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .prompt-manager {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(20px);
    color: #e2e8f0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: rgba(30, 41, 59, 0.6);
    border-bottom: 1px solid rgba(99, 102, 241, 0.2);
  }

  .header h1 {
    font-size: 1.25rem;
    font-weight: 600;
    background: linear-gradient(135deg, #818cf8, #6366f1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .btn svg {
    width: 16px;
    height: 16px;
  }

  .btn-primary {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  .btn-secondary {
    background: rgba(51, 65, 85, 0.6);
    color: #e2e8f0;
    border: 1px solid rgba(99, 102, 241, 0.3);
  }

  .btn-secondary:hover {
    background: rgba(51, 65, 85, 0.8);
    border-color: rgba(99, 102, 241, 0.5);
  }

  .btn-icon {
    padding: 6px;
    background: rgba(51, 65, 85, 0.4);
    border-radius: 6px;
  }

  .btn-icon:hover {
    background: rgba(99, 102, 241, 0.3);
  }

  .btn-icon.btn-danger:hover {
    background: rgba(239, 68, 68, 0.3);
    color: #fca5a5;
  }

  .toolbar {
    display: flex;
    gap: 16px;
    padding: 12px 20px;
    background: rgba(30, 41, 59, 0.4);
    border-bottom: 1px solid rgba(51, 65, 85, 0.5);
    flex-wrap: wrap;
  }

  .search-box {
    flex: 1;
    min-width: 200px;
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.6);
    border-radius: 8px;
    padding: 0 12px;
  }

  .search-box svg {
    width: 18px;
    height: 18px;
    color: #64748b;
  }

  .search-box input {
    flex: 1;
    background: transparent;
    border: none;
    padding: 10px 0;
    color: #e2e8f0;
    font-size: 0.875rem;
    outline: none;
  }

  .search-box input::placeholder {
    color: #64748b;
  }

  .filters {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  select {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.6);
    border-radius: 8px;
    padding: 10px 12px;
    color: #e2e8f0;
    font-size: 0.875rem;
    cursor: pointer;
    outline: none;
  }

  select:focus {
    border-color: rgba(99, 102, 241, 0.5);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    color: #94a3b8;
  }

  .checkbox-label input {
    width: 16px;
    height: 16px;
    accent-color: #6366f1;
  }

  .prompts-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: #64748b;
  }

  .empty-state svg {
    width: 64px;
    height: 64px;
    opacity: 0.5;
  }

  .prompt-card {
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: 12px;
    padding: 16px;
    transition: all 0.2s;
  }

  .prompt-card:hover {
    border-color: rgba(99, 102, 241, 0.4);
    background: rgba(30, 41, 59, 0.7);
  }

  .prompt-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .favorite-btn {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: #64748b;
    transition: color 0.2s;
  }

  .favorite-btn:hover,
  .favorite-btn.active {
    color: #fbbf24;
  }

  .favorite-btn svg {
    width: 18px;
    height: 18px;
  }

  .prompt-header h3 {
    flex: 1;
    font-size: 1rem;
    font-weight: 600;
    color: #f1f5f9;
  }

  .category-badge {
    font-size: 0.75rem;
    padding: 4px 10px;
    background: rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
    border-radius: 12px;
  }

  .prompt-preview {
    font-size: 0.875rem;
    color: #94a3b8;
    line-height: 1.5;
    margin-bottom: 10px;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }

  .tag {
    font-size: 0.75rem;
    padding: 3px 8px;
    background: rgba(51, 65, 85, 0.6);
    color: #94a3b8;
    border-radius: 6px;
  }

  .variables-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 10px;
  }

  .variables-badge svg {
    width: 14px;
    height: 14px;
  }

  .prompt-actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    padding-top: 10px;
    border-top: 1px solid rgba(51, 65, 85, 0.4);
  }

  .edit-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .edit-tabs {
    display: flex;
    gap: 4px;
    padding: 12px 20px 0;
    background: rgba(30, 41, 59, 0.4);
  }

  .tab {
    padding: 10px 20px;
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  .tab:hover {
    color: #e2e8f0;
  }

  .tab.active {
    color: #a5b4fc;
    border-bottom-color: #6366f1;
  }

  .edit-form {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .hint {
    font-weight: 400;
    font-size: 0.75rem;
    color: #64748b;
  }

  .form-group input,
  .form-group textarea {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.6);
    border-radius: 8px;
    padding: 10px 12px;
    color: #e2e8f0;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.2s;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    border-color: rgba(99, 102, 241, 0.5);
  }

  .form-group textarea {
    resize: vertical;
    min-height: 120px;
    font-family: 'SF Mono', Monaco, Consolas, monospace;
    line-height: 1.6;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 16px;
  }

  .variables-section {
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(51, 65, 85, 0.4);
    border-radius: 10px;
    padding: 16px;
  }

  .variables-section h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #a5b4fc;
    margin-bottom: 12px;
  }

  .variable-config {
    display: grid;
    grid-template-columns: 120px 1fr 1fr;
    gap: 10px;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(51, 65, 85, 0.3);
  }

  .variable-config:last-child {
    border-bottom: none;
  }

  .variable-name {
    font-family: 'SF Mono', Monaco, Consolas, monospace;
    font-size: 0.8rem;
    color: #fbbf24;
    background: rgba(251, 191, 36, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
  }

  .variable-config input {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.6);
    border-radius: 6px;
    padding: 8px 10px;
    color: #e2e8f0;
    font-size: 0.8rem;
    outline: none;
  }

  .variable-config input:focus {
    border-color: rgba(99, 102, 241, 0.5);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 16px;
    border-top: 1px solid rgba(51, 65, 85, 0.4);
  }

  .preview-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 20px;
    gap: 16px;
    overflow-y: auto;
  }

  .preview-variables {
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(51, 65, 85, 0.4);
    border-radius: 10px;
    padding: 16px;
  }

  .preview-variables h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #a5b4fc;
    margin-bottom: 12px;
  }

  .preview-variable-input {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
  }

  .preview-variable-input:last-child {
    margin-bottom: 0;
  }

  .preview-variable-input label {
    font-size: 0.8rem;
    font-weight: 500;
    color: #94a3b8;
  }

  .var-desc {
    font-weight: 400;
    color: #64748b;
    margin-left: 6px;
  }

  .preview-variable-input input {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.6);
    border-radius: 6px;
    padding: 10px 12px;
    color: #e2e8f0;
    font-size: 0.875rem;
    outline: none;
  }

  .preview-variable-input input:focus {
    border-color: rgba(99, 102, 241, 0.5);
  }

  .preview-output {
    flex: 1;
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(51, 65, 85, 0.4);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    min-height: 200px;
  }

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(51, 65, 85, 0.4);
  }

  .preview-header h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #a5b4fc;
  }

  .preview-text {
    flex: 1;
    padding: 16px;
    margin: 0;
    font-family: 'SF Mono', Monaco, Consolas, monospace;
    font-size: 0.875rem;
    line-height: 1.7;
    color: #e2e8f0;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-y: auto;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.3);
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.3);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.5);
  }
</style>

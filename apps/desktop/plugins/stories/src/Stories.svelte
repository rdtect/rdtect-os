<script lang="ts">
  import type { StoryPost } from './types';
  import {
    stories as allStories,
    getAllTags,
    filterByTag,
    searchStories,
    formatDate,
    formatRelativeTime
  } from './data';
  import ArticleRenderer from './ArticleRenderer.svelte';
  import SlideRenderer from './SlideRenderer.svelte';
  import ScrollRenderer from './ScrollRenderer.svelte';

  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  let selectedStory = $state<StoryPost | null>(null);
  let searchQuery = $state('');
  let selectedTag = $state<string | null>(null);

  const allTags = $derived(getAllTags(allStories));

  const filteredStories = $derived(() => {
    let result = allStories;
    if (selectedTag) result = filterByTag(result, selectedTag);
    if (searchQuery.trim()) result = searchStories(result, searchQuery);
    return result.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  });

  const featuredStory = $derived(allStories.find(s => s.featured));

  function handleSelectStory(story: StoryPost) {
    selectedStory = story;
  }

  function handleBack() {
    selectedStory = null;
  }

  function handleTagClick(tag: string) {
    selectedTag = selectedTag === tag ? null : tag;
  }

  function clearFilters() {
    searchQuery = '';
    selectedTag = null;
  }

  function formatIcon(format: string): string {
    if (format === 'slides') return '\u{1F3AC}';
    if (format === 'scroll') return '\u{1F4DC}';
    return '\u{1F4DD}';
  }

  function formatLabel(format: string): string {
    if (format === 'slides') return 'Slides';
    if (format === 'scroll') return 'Scroll';
    return 'Article';
  }
</script>

<div class="stories-app">
  {#if selectedStory}
    {#if selectedStory.format === 'slides'}
      <SlideRenderer story={selectedStory} onBack={handleBack} />
    {:else if selectedStory.format === 'scroll'}
      <ScrollRenderer story={selectedStory} onBack={handleBack} />
    {:else}
      <ArticleRenderer story={selectedStory} onBack={handleBack} onSelectStory={handleSelectStory} />
    {/if}
  {:else}
    <!-- Header -->
    <header class="stories-header">
      <div class="header-content">
        <div class="brand">
          <div class="logo">\u{1F4D6}</div>
          <div>
            <h1>Stories</h1>
            <p class="tagline">Articles, decks & immersive scrolls</p>
          </div>
        </div>

        <div class="search-container">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search stories..."
            bind:value={searchQuery}
            class="search-input"
          />
          {#if searchQuery}
            <button class="clear-search" onclick={() => searchQuery = ''} type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          {/if}
        </div>
      </div>

      <!-- Tags -->
      <div class="tags-filter">
        <button
          class="tag-btn"
          class:active={!selectedTag}
          onclick={() => selectedTag = null}
          type="button"
        >
          All
        </button>
        {#each allTags as tag}
          <button
            class="tag-btn"
            class:active={selectedTag === tag}
            onclick={() => handleTagClick(tag)}
            type="button"
          >
            {tag}
          </button>
        {/each}
      </div>
    </header>

    <!-- Content -->
    <main class="stories-content">
      <!-- Featured -->
      {#if featuredStory && !selectedTag && !searchQuery.trim()}
        <section class="featured-section">
          <button class="featured-hero" onclick={() => handleSelectStory(featuredStory)} type="button">
            {#if featuredStory.coverImage}
              <div class="featured-image">
                <img src={featuredStory.coverImage} alt={featuredStory.title} />
                <div class="featured-overlay"></div>
              </div>
            {/if}
            <div class="featured-content">
              <div class="featured-badges">
                <span class="featured-badge">Featured</span>
                <span class="format-badge format-{featuredStory.format}">
                  {formatIcon(featuredStory.format)} {formatLabel(featuredStory.format)}
                </span>
              </div>
              <h2>{featuredStory.title}</h2>
              <p>{featuredStory.excerpt}</p>
              <div class="featured-meta">
                {#if featuredStory.author.avatar}
                  <img src={featuredStory.author.avatar} alt={featuredStory.author.name} class="featured-avatar" />
                {/if}
                <span>{featuredStory.author.name}</span>
                <span class="dot"></span>
                <span>{formatDate(featuredStory.publishedAt)}</span>
                <span class="dot"></span>
                <span>{featuredStory.readTime} min</span>
              </div>
            </div>
          </button>
        </section>
      {/if}

      <!-- Grid -->
      <section class="grid-section">
        {#if !selectedTag && !searchQuery.trim()}
          <h2 class="section-title">All Stories</h2>
        {:else}
          <h2 class="section-title">
            {filteredStories().length} {filteredStories().length === 1 ? 'story' : 'stories'} found
            {#if selectedTag || searchQuery}
              <button class="clear-filters" onclick={clearFilters} type="button">Clear</button>
            {/if}
          </h2>
        {/if}

        {#if filteredStories().length === 0}
          <div class="empty-state">
            <div class="empty-icon">\u{1F50D}</div>
            <p class="empty-title">No stories found</p>
            <p class="empty-hint">Try adjusting your search or filters</p>
            <button class="empty-clear" onclick={clearFilters} type="button">Clear filters</button>
          </div>
        {:else}
          <div class="stories-grid">
            {#each filteredStories() as story (story.id)}
              <button class="story-card" onclick={() => handleSelectStory(story)} type="button">
                {#if story.coverImage}
                  <div class="card-image">
                    <img src={story.coverImage} alt={story.title} loading="lazy" />
                    <span class="card-format format-{story.format}">
                      {formatIcon(story.format)} {formatLabel(story.format)}
                    </span>
                  </div>
                {/if}
                <div class="card-content">
                  <div class="card-meta">
                    <span title={formatDate(story.publishedAt)}>{formatRelativeTime(story.publishedAt)}</span>
                    <span class="sep">&middot;</span>
                    <span>{story.readTime} min</span>
                  </div>
                  <h3 class="card-title">{story.title}</h3>
                  <p class="card-excerpt">{story.excerpt}</p>
                  <div class="card-tags">
                    {#each story.tags.slice(0, 3) as tag}
                      <span class="card-tag">{tag}</span>
                    {/each}
                    {#if story.tags.length > 3}
                      <span class="card-tag more">+{story.tags.length - 3}</span>
                    {/if}
                  </div>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </section>
    </main>

    <!-- Footer -->
    <footer class="stories-footer">
      <span>{allStories.length} stories</span>
    </footer>
  {/if}
</div>

<style>
  .stories-app {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f172a;
    color: #f1f5f9;
    font-family: var(--desktop-font-sans);
  }

  /* Header */
  .stories-header {
    padding: 1rem 1.5rem;
    background: var(--glass-bg-strong);
    border-bottom: 1px solid #334155;
    backdrop-filter: blur(var(--glass-blur));
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 0.75rem;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: var(--radius-md);
    font-size: 1.25rem;
  }

  .brand h1 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
    color: #f1f5f9;
  }

  .tagline {
    margin: 0;
    font-size: 0.75rem;
    color: #64748b;
  }

  /* Search */
  .search-container {
    position: relative;
    flex: 1;
    max-width: 280px;
  }

  .search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 2rem 0.5rem 2.25rem;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: var(--radius-md);
    color: #f1f5f9;
    font-size: var(--text-sm);
    outline: none;
    transition: all var(--transition-fast) var(--transition-easing);
  }

  .search-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  }

  .search-input::placeholder { color: #64748b; }

  .clear-search {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast) var(--transition-easing);
  }

  .clear-search:hover {
    background: #334155;
    color: #f1f5f9;
  }

  /* Tags */
  .tags-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .tag-btn {
    padding: 0.3rem 0.75rem;
    background: transparent;
    border: 1px solid #334155;
    border-radius: var(--radius-full);
    color: #94a3b8;
    font-size: var(--text-xs);
    cursor: pointer;
    transition: all var(--transition-fast) var(--transition-easing);
    min-height: 30px;
  }

  .tag-btn:hover {
    background: #334155;
    color: #f1f5f9;
  }

  .tag-btn.active {
    background: #6366f1;
    border-color: #6366f1;
    color: white;
  }

  /* Content */
  .stories-content {
    flex: 1;
    overflow-y: auto;
  }

  /* Featured */
  .featured-section {
    padding: 1.5rem;
  }

  .featured-hero {
    position: relative;
    display: block;
    width: 100%;
    min-height: 280px;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: var(--radius-xl);
    overflow: hidden;
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
    text-align: left;
    font-family: inherit;
    color: inherit;
  }

  .featured-hero:hover {
    border-color: #6366f1;
    transform: var(--card-hover-transform);
    box-shadow: var(--card-hover-shadow);
  }

  .featured-image {
    position: absolute;
    inset: 0;
  }

  .featured-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  .featured-hero:hover .featured-image img {
    transform: scale(1.05);
  }

  .featured-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.5) 50%, rgba(15, 23, 42, 0.2) 100%);
  }

  .featured-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1.75rem;
  }

  .featured-badges {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .featured-badge {
    padding: 0.3rem 0.75rem;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: var(--radius-full);
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: white;
  }

  .format-badge {
    padding: 0.3rem 0.75rem;
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: var(--radius-full);
    font-size: var(--text-xs);
    font-weight: 500;
    color: #a5b4fc;
    backdrop-filter: blur(4px);
  }

  .featured-content h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #f1f5f9;
    line-height: 1.3;
  }

  .featured-content p {
    margin: 0 0 0.75rem 0;
    font-size: var(--text-sm);
    color: #cbd5e1;
    line-height: 1.6;
    max-width: 550px;
  }

  .featured-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .featured-avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
  }

  .dot {
    width: 3px;
    height: 3px;
    background: #475569;
    border-radius: 50%;
  }

  /* Grid */
  .grid-section {
    padding: 0 1.5rem 1.5rem;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0 0 1rem 0;
    font-size: var(--text-sm);
    font-weight: 600;
    color: #94a3b8;
  }

  .clear-filters {
    padding: 0.2rem 0.5rem;
    background: transparent;
    border: none;
    color: #ef4444;
    font-size: 0.75rem;
    cursor: pointer;
    transition: color var(--transition-fast) var(--transition-easing);
  }

  .clear-filters:hover { color: #f87171; }

  .stories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
  }

  .story-card {
    display: flex;
    flex-direction: column;
    background: var(--glass-bg-default);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
    text-align: left;
    width: 100%;
    font-family: inherit;
    color: inherit;
  }

  .story-card:hover {
    border-color: #6366f1;
    transform: var(--card-hover-transform);
    box-shadow: var(--card-hover-shadow);
  }

  .card-image {
    position: relative;
    width: 100%;
    height: 160px;
    overflow: hidden;
  }

  .card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--transition-slow) var(--transition-easing);
  }

  .story-card:hover .card-image img {
    transform: scale(1.05);
  }

  .card-format {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 0.2rem 0.6rem;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: var(--radius-full);
    font-size: 0.625rem;
    font-weight: 600;
    color: #a5b4fc;
    backdrop-filter: blur(4px);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .card-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }

  .card-meta {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: var(--text-xs);
    color: #64748b;
  }

  .sep { color: #475569; }

  .card-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.4;
    color: #f1f5f9;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-excerpt {
    margin: 0;
    font-size: var(--text-xs);
    line-height: 1.5;
    color: #94a3b8;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-top: auto;
  }

  .card-tag {
    padding: 3px 8px;
    background: rgba(var(--desktop-accent-rgb), 0.1);
    border: 1px solid rgba(var(--desktop-accent-rgb), 0.2);
    border-radius: var(--radius-sm);
    font-size: 0.625rem;
    color: #a5b4fc;
  }

  .card-tag.more {
    background: rgba(100, 116, 139, 0.2);
    border-color: rgba(100, 116, 139, 0.3);
    color: #64748b;
  }

  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1.5rem;
    gap: 0.5rem;
    text-align: center;
  }

  .empty-icon { font-size: 40px; opacity: 0.35; }

  .empty-title {
    margin: 0;
    font-size: var(--text-md);
    font-weight: 600;
    color: #94a3b8;
  }

  .empty-hint {
    margin: 0;
    font-size: var(--text-sm);
    color: #64748b;
  }

  .empty-clear {
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
    background: #6366f1;
    border: none;
    border-radius: var(--radius-md);
    color: white;
    font-size: var(--text-sm);
    cursor: pointer;
    transition: background var(--transition-fast) var(--transition-easing);
    min-height: 36px;
  }

  .empty-clear:hover { background: #4f46e5; }

  /* Footer */
  .stories-footer {
    display: flex;
    align-items: center;
    padding: 0.5rem 1.5rem;
    background: var(--glass-bg-strong);
    border-top: 1px solid #334155;
    font-size: 0.6875rem;
    color: #64748b;
  }

  /* Scrollbar */
  .stories-content::-webkit-scrollbar { width: var(--scrollbar-width); }
  .stories-content::-webkit-scrollbar-track { background: transparent; }
  .stories-content::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: var(--radius-full); }
  .stories-content::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }

  .search-input:focus-visible,
  .tag-btn:focus-visible,
  .featured-hero:focus-visible,
  .story-card:focus-visible {
    outline: 2px solid rgba(99, 102, 241, 0.6);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .featured-image img,
    .story-card,
    .featured-hero {
      transition: none;
    }
  }
</style>

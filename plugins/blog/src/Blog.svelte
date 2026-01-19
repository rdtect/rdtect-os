<script lang="ts">
  import { onMount } from 'svelte';
  import type { BlogPost } from './data';
  import {
    samplePosts,
    getAllTags,
    filterPostsByTag,
    searchPosts,
    getFeaturedPost,
    formatDate,
    formatRelativeTime
  } from './data';
  import PostList from './PostList.svelte';
  import PostCard from './PostCard.svelte';
  import PostView from './PostView.svelte';

  // Props from window manager
  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  // State
  let posts = $state<BlogPost[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let searchQuery = $state('');
  let selectedTag = $state<string | null>(null);
  let selectedPost = $state<BlogPost | null>(null);

  // Derived
  const allTags = $derived(getAllTags(posts));
  const featuredPost = $derived(getFeaturedPost(posts));

  const filteredPosts = $derived(() => {
    let result = posts;

    // Apply tag filter
    if (selectedTag) {
      result = filterPostsByTag(result, selectedTag);
    }

    // Apply search
    if (searchQuery.trim()) {
      result = searchPosts(result, searchQuery);
    }

    // Sort by date (newest first)
    return result.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  });

  // Non-featured posts for the list
  const listPosts = $derived(() => {
    const filtered = filteredPosts();
    // If showing all posts (no filter), exclude featured from list
    if (!selectedTag && !searchQuery.trim() && featuredPost) {
      return filtered.filter(p => p.id !== featuredPost.id);
    }
    return filtered;
  });

  // Try to fetch from PocketBase, fallback to sample data
  async function fetchPosts() {
    loading = true;
    error = null;

    try {
      // Try PocketBase first (if configured)
      const pbUrl = import.meta.env.VITE_POCKETBASE_URL;
      if (pbUrl) {
        const response = await fetch(`${pbUrl}/api/collections/blog_posts/records?sort=-published_at`);
        if (response.ok) {
          const data = await response.json();
          posts = data.items.map((item: Record<string, unknown>) => ({
            id: item.id,
            title: item.title,
            slug: item.slug,
            excerpt: item.excerpt,
            content: item.content,
            coverImage: item.cover_image,
            author: {
              name: item.author_name || 'rdtect',
              avatar: item.author_avatar
            },
            publishedAt: item.published_at,
            updatedAt: item.updated_at,
            readTime: item.read_time || 5,
            tags: item.tags || [],
            featured: item.featured
          }));
          loading = false;
          return;
        }
      }
    } catch (e) {
      console.log('PocketBase not available, using sample data');
    }

    // Fallback to sample data
    posts = samplePosts;
    loading = false;
  }

  // Load posts on mount
  onMount(() => {
    fetchPosts();
  });

  // Handlers
  function handleSelectPost(post: BlogPost) {
    selectedPost = post;
  }

  function handleBackToList() {
    selectedPost = null;
  }

  function handleTagClick(tag: string) {
    if (selectedTag === tag) {
      selectedTag = null;
    } else {
      selectedTag = tag;
    }
    selectedPost = null;
  }

  function clearFilters() {
    searchQuery = '';
    selectedTag = null;
  }
</script>

<div class="blog-app">
  {#if selectedPost}
    <PostView
      post={selectedPost}
      onBack={handleBackToList}
      onSelectPost={handleSelectPost}
    />
  {:else}
    <!-- Header -->
    <header class="blog-header">
      <div class="header-content">
        <div class="brand">
          <div class="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              <line x1="8" y1="7" x2="16" y2="7"/>
              <line x1="8" y1="11" x2="16" y2="11"/>
              <line x1="8" y1="15" x2="12" y2="15"/>
            </svg>
          </div>
          <div>
            <h1>Blog</h1>
            <p class="tagline">Technical articles and thoughts</p>
          </div>
        </div>

        <div class="search-container">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search posts..."
            bind:value={searchQuery}
            class="search-input"
          />
          {#if searchQuery}
            <button class="clear-search" onclick={() => searchQuery = ''} type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          {/if}
        </div>
      </div>

      <!-- Tags Filter -->
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

      <!-- Active Filters -->
      {#if selectedTag || searchQuery}
        <div class="active-filters">
          <span class="filter-label">Filters:</span>
          {#if selectedTag}
            <button class="filter-chip" onclick={() => selectedTag = null} type="button">
              Tag: {selectedTag}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          {/if}
          {#if searchQuery}
            <button class="filter-chip" onclick={() => searchQuery = ''} type="button">
              Search: "{searchQuery.slice(0, 20)}{searchQuery.length > 20 ? '...' : ''}"
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          {/if}
          <button class="clear-all" onclick={clearFilters} type="button">
            Clear all
          </button>
        </div>
      {/if}
    </header>

    <!-- Main Content -->
    <main class="blog-content">
      {#if loading}
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading posts...</p>
        </div>
      {:else if error}
        <div class="error-state">
          <p>{error}</p>
          <button onclick={fetchPosts} type="button">Try Again</button>
        </div>
      {:else}
        <!-- Featured Post Hero (only when not filtering) -->
        {#if featuredPost && !selectedTag && !searchQuery.trim()}
          <section class="featured-section">
            <button
              class="featured-hero"
              onclick={() => handleSelectPost(featuredPost)}
              type="button"
            >
              {#if featuredPost.coverImage}
                <div class="featured-image">
                  <img src={featuredPost.coverImage} alt={featuredPost.title} />
                  <div class="featured-overlay"></div>
                </div>
              {/if}
              <div class="featured-content">
                <span class="featured-badge">Featured Post</span>
                <h2>{featuredPost.title}</h2>
                <p>{featuredPost.excerpt}</p>
                <div class="featured-meta">
                  <div class="author">
                    {#if featuredPost.author.avatar}
                      <img src={featuredPost.author.avatar} alt={featuredPost.author.name} />
                    {/if}
                    <span>{featuredPost.author.name}</span>
                  </div>
                  <span class="dot"></span>
                  <span>{formatDate(featuredPost.publishedAt)}</span>
                  <span class="dot"></span>
                  <span>{featuredPost.readTime} min read</span>
                </div>
              </div>
            </button>
          </section>
        {/if}

        <!-- Post List -->
        <section class="posts-section">
          {#if !selectedTag && !searchQuery.trim()}
            <h2 class="section-title">Recent Posts</h2>
          {:else}
            <h2 class="section-title">
              {filteredPosts().length} {filteredPosts().length === 1 ? 'post' : 'posts'} found
            </h2>
          {/if}

          <PostList
            posts={listPosts()}
            onSelectPost={handleSelectPost}
            {loading}
            emptyMessage={searchQuery ? 'No posts match your search' : 'No posts found'}
          />
        </section>
      {/if}
    </main>

    <!-- Footer -->
    <footer class="blog-footer">
      <span class="post-count">{posts.length} articles</span>
      <span class="plugin-badge">Native Plugin</span>
    </footer>
  {/if}
</div>

<style>
  .blog-app {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f172a;
    color: #f1f5f9;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  /* Header */
  .blog-header {
    padding: 1.25rem 1.5rem;
    background: #1e293b;
    border-bottom: 1px solid #334155;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1rem;
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
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 10px;
    color: white;
  }

  .brand h1 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #f1f5f9;
  }

  .tagline {
    margin: 0;
    font-size: 0.8125rem;
    color: #64748b;
  }

  /* Search */
  .search-container {
    position: relative;
    flex: 1;
    max-width: 320px;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.625rem 2.5rem 0.625rem 2.5rem;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    color: #f1f5f9;
    font-size: 0.875rem;
    outline: none;
    transition: all 0.15s ease;
  }

  .search-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  }

  .search-input::placeholder {
    color: #64748b;
  }

  .clear-search {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.15s ease;
  }

  .clear-search:hover {
    background: #334155;
    color: #f1f5f9;
  }

  /* Tags Filter */
  .tags-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag-btn {
    padding: 0.375rem 0.875rem;
    background: transparent;
    border: 1px solid #334155;
    border-radius: 20px;
    color: #94a3b8;
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.15s ease;
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

  /* Active Filters */
  .active-filters {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #334155;
  }

  .filter-label {
    font-size: 0.8125rem;
    color: #64748b;
  }

  .filter-chip {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.625rem;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 6px;
    color: #a5b4fc;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .filter-chip:hover {
    background: rgba(99, 102, 241, 0.25);
  }

  .clear-all {
    padding: 0.25rem 0.5rem;
    background: transparent;
    border: none;
    color: #ef4444;
    font-size: 0.75rem;
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .clear-all:hover {
    color: #f87171;
  }

  /* Main Content */
  .blog-content {
    flex: 1;
    overflow-y: auto;
  }

  /* Featured Section */
  .featured-section {
    padding: 1.5rem;
  }

  .featured-hero {
    position: relative;
    display: block;
    width: 100%;
    min-height: 320px;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 16px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.25s ease;
    text-align: left;
    font-family: inherit;
    color: inherit;
  }

  .featured-hero:hover {
    border-color: #6366f1;
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
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
    padding: 2rem;
  }

  .featured-badge {
    display: inline-block;
    padding: 0.375rem 0.875rem;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 20px;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: white;
    margin-bottom: 1rem;
  }

  .featured-content h2 {
    margin: 0 0 0.75rem 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: #f1f5f9;
    line-height: 1.3;
  }

  .featured-content p {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #cbd5e1;
    line-height: 1.6;
    max-width: 600px;
  }

  .featured-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.8125rem;
    color: #94a3b8;
  }

  .featured-meta .author {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .featured-meta .author img {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }

  .featured-meta .dot {
    width: 4px;
    height: 4px;
    background: #475569;
    border-radius: 50%;
  }

  /* Posts Section */
  .posts-section {
    padding: 0 1.5rem 1.5rem;
  }

  .section-title {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #94a3b8;
  }

  /* States */
  .loading-state,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    height: 200px;
    color: #64748b;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #334155;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-state button {
    padding: 0.5rem 1rem;
    background: #6366f1;
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .error-state button:hover {
    background: #4f46e5;
  }

  /* Footer */
  .blog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.5rem;
    background: #1e293b;
    border-top: 1px solid #334155;
    font-size: 0.75rem;
  }

  .post-count {
    color: #64748b;
  }

  .plugin-badge {
    padding: 0.25rem 0.5rem;
    background: #6366f1;
    border-radius: 4px;
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: white;
  }

  /* Scrollbar */
  .blog-content::-webkit-scrollbar {
    width: 8px;
  }

  .blog-content::-webkit-scrollbar-track {
    background: #0f172a;
  }

  .blog-content::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 4px;
  }

  .blog-content::-webkit-scrollbar-thumb:hover {
    background: #475569;
  }
</style>

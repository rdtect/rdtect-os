<script lang="ts">
  import type { BlogPost } from './data';
  import PostCard from './PostCard.svelte';

  interface Props {
    posts: BlogPost[];
    onSelectPost: (post: BlogPost) => void;
    loading?: boolean;
    emptyMessage?: string;
  }

  let {
    posts,
    onSelectPost,
    loading = false,
    emptyMessage = 'No posts found'
  }: Props = $props();
</script>

<div class="post-list">
  {#if loading}
    <div class="loading">
      <div class="loading-spinner"></div>
      <span>Loading posts...</span>
    </div>
  {:else if posts.length === 0}
    <div class="empty-state">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V9a2 2 0 012-2h2a2 2 0 012 2v9a2 2 0 01-2 2h-2z"/>
          <line x1="9" y1="9" x2="13" y2="9"/>
          <line x1="9" y1="13" x2="13" y2="13"/>
        </svg>
      </div>
      <p class="empty-message">{emptyMessage}</p>
    </div>
  {:else}
    <div class="grid">
      {#each posts as post (post.id)}
        <PostCard {post} onSelect={onSelectPost} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .post-list {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    height: 200px;
    color: #64748b;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #334155;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    height: 200px;
    color: #64748b;
  }

  .empty-icon {
    opacity: 0.5;
  }

  .empty-message {
    margin: 0;
    font-size: 0.9375rem;
  }

  /* Scrollbar styling */
  .post-list::-webkit-scrollbar {
    width: 8px;
  }

  .post-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .post-list::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 4px;
  }

  .post-list::-webkit-scrollbar-thumb:hover {
    background: #475569;
  }
</style>

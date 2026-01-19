<script lang="ts">
  import type { BlogPost } from './data';
  import { formatDate, formatRelativeTime } from './data';

  interface Props {
    post: BlogPost;
    onSelect: (post: BlogPost) => void;
    compact?: boolean;
  }

  let { post, onSelect, compact = false }: Props = $props();
</script>

<button
  class="post-card"
  class:compact
  onclick={() => onSelect(post)}
  type="button"
>
  {#if !compact && post.coverImage}
    <div class="cover-image">
      <img src={post.coverImage} alt={post.title} loading="lazy" />
      {#if post.featured}
        <span class="featured-badge">Featured</span>
      {/if}
    </div>
  {/if}

  <div class="content">
    <div class="meta">
      <span class="date" title={formatDate(post.publishedAt)}>
        {formatRelativeTime(post.publishedAt)}
      </span>
      <span class="separator">-</span>
      <span class="read-time">{post.readTime} min read</span>
    </div>

    <h3 class="title">{post.title}</h3>

    {#if !compact}
      <p class="excerpt">{post.excerpt}</p>
    {/if}

    <div class="tags">
      {#each post.tags.slice(0, compact ? 2 : 4) as tag}
        <span class="tag">{tag}</span>
      {/each}
      {#if post.tags.length > (compact ? 2 : 4)}
        <span class="tag more">+{post.tags.length - (compact ? 2 : 4)}</span>
      {/if}
    </div>
  </div>
</button>

<style>
  .post-card {
    display: flex;
    flex-direction: column;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
    font-family: inherit;
    color: inherit;
  }

  .post-card:hover {
    border-color: #6366f1;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }

  .post-card:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
  }

  .post-card.compact {
    flex-direction: row;
    gap: 1rem;
    padding: 1rem;
  }

  .cover-image {
    position: relative;
    width: 100%;
    height: 180px;
    overflow: hidden;
  }

  .cover-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .post-card:hover .cover-image img {
    transform: scale(1.05);
  }

  .featured-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 4px 10px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: white;
  }

  .content {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
  }

  .compact .content {
    padding: 0;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 12px;
    color: #64748b;
  }

  .separator {
    color: #475569;
  }

  .title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.4;
    color: #f1f5f9;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .compact .title {
    font-size: 1rem;
  }

  .excerpt {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.6;
    color: #94a3b8;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: auto;
  }

  .tag {
    padding: 4px 10px;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 6px;
    font-size: 11px;
    color: #a5b4fc;
    transition: all 0.15s ease;
  }

  .tag.more {
    background: rgba(100, 116, 139, 0.2);
    border-color: rgba(100, 116, 139, 0.3);
    color: #64748b;
  }

  .post-card:hover .tag {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.3);
  }
</style>

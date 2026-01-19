export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: {
    name: string;
    avatar?: string;
  };
  publishedAt: string;
  updatedAt?: string;
  readTime: number;
  tags: string[];
  featured?: boolean;
}

// Calculate reading time from content (words / 200 wpm)
export function calculateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

// Sample blog posts data
export const samplePosts: BlogPost[] = [
  {
    id: '1',
    title: 'Building a Desktop Environment in the Browser',
    slug: 'building-desktop-environment-browser',
    excerpt: 'Exploring the architecture and design decisions behind creating a fully-featured desktop operating system that runs entirely in your web browser.',
    content: `# Building a Desktop Environment in the Browser

Creating a desktop environment in the browser is an ambitious project that pushes the boundaries of what's possible with modern web technologies. In this article, I'll share the key architectural decisions and challenges we faced while building rdtect OS.

## The Architecture

The foundation of our desktop environment is built on three core principles:

1. **Modularity** - Everything is a plugin
2. **Performance** - Smooth 60fps interactions
3. **Familiarity** - Desktop metaphors users expect

### Plugin System

At the heart of rdtect OS is a flexible plugin system that supports multiple integration patterns:

\`\`\`typescript
interface PluginManifest {
  id: string;
  name: string;
  type: 'native' | 'iframe' | 'webcomponent' | 'federation' | 'wasm';
  entry: string;
  defaultWidth: number;
  defaultHeight: number;
}
\`\`\`

Each plugin type serves different use cases:

- **Native plugins** are Svelte 5 components with full access to the desktop API
- **iframe plugins** provide isolation for third-party content
- **WebComponents** enable framework-agnostic widgets
- **Federation** allows runtime module loading from remote hosts
- **WASM** plugins bring native-speed computation to the browser

### Window Management

The window manager handles all the complexity of a multi-window environment:

\`\`\`typescript
interface WindowState {
  id: string;
  pluginId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  focused: boolean;
}
\`\`\`

We use a virtual coordinate system that maps to the viewport, handling window positioning, resizing, snapping, and z-index management.

## Challenges We Faced

### 1. Performance with Many Windows

Opening 10+ windows with complex content can strain browser resources. We implemented:

- Virtual scrolling for lists
- Lazy rendering of off-screen content
- RequestAnimationFrame-based animations
- CSS containment for layout isolation

### 2. Cross-Plugin Communication

Plugins need to communicate without tight coupling. Our message bus provides:

\`\`\`typescript
interface PluginMessage {
  type: string;
  source: string;
  target?: string;
  payload: unknown;
}

// Send a message to another plugin
messageBus.send({
  type: 'FILE_OPEN',
  source: 'file-browser',
  target: 'code-editor',
  payload: { path: '/documents/readme.md' }
});
\`\`\`

### 3. State Persistence

Users expect their workspace to persist. We use IndexedDB for:

- Window positions and states
- Application preferences
- File system (virtual)
- Session data

## What's Next

We're actively working on:

- Real-time collaboration features
- Cloud storage integration
- Mobile-responsive layouts
- Accessibility improvements

Building a desktop in the browser is challenging but incredibly rewarding. The web platform continues to evolve, and projects like this push its capabilities forward.

---

*Have questions or suggestions? Feel free to reach out!*`,
    coverImage: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&h=400&fit=crop',
    author: {
      name: 'rdtect',
      avatar: 'https://github.com/rdtect.png'
    },
    publishedAt: '2025-01-15T10:00:00Z',
    readTime: 6,
    tags: ['architecture', 'svelte', 'typescript', 'web-development'],
    featured: true
  },
  {
    id: '2',
    title: 'Svelte 5 Runes: A Deep Dive into Reactive Primitives',
    slug: 'svelte-5-runes-deep-dive',
    excerpt: 'Understanding the new reactivity system in Svelte 5 and how runes transform the way we write reactive code.',
    content: `# Svelte 5 Runes: A Deep Dive into Reactive Primitives

Svelte 5 introduces a completely new approach to reactivity with runes. Let's explore what they are and how to use them effectively.

## What Are Runes?

Runes are special symbols (prefixed with \`$\`) that give instructions to the Svelte compiler. They replace the implicit reactivity of Svelte 4 with explicit, predictable primitives.

## The Core Runes

### $state - Reactive State

The most fundamental rune creates reactive state:

\`\`\`svelte
<script>
  let count = $state(0);
  let user = $state({ name: 'Alice', age: 30 });
</script>

<button onclick={() => count++}>
  Clicked {count} times
</button>
\`\`\`

Key differences from Svelte 4:
- State is explicitly declared
- Objects and arrays are deeply reactive by default
- Works in both \`.svelte\` files and \`.svelte.ts\` files

### $derived - Computed Values

For values computed from other reactive values:

\`\`\`svelte
<script>
  let width = $state(10);
  let height = $state(20);

  let area = $derived(width * height);
  let perimeter = $derived(2 * (width + height));
</script>
\`\`\`

Derived values:
- Automatically update when dependencies change
- Are read-only
- Are lazily computed

### $effect - Side Effects

For code that should run when reactive values change:

\`\`\`svelte
<script>
  let searchQuery = $state('');
  let results = $state([]);

  $effect(() => {
    // This runs whenever searchQuery changes
    const query = searchQuery.trim();
    if (query.length > 2) {
      fetch(\`/api/search?q=\${query}\`)
        .then(r => r.json())
        .then(data => results = data);
    }
  });
</script>
\`\`\`

Effects:
- Run after the DOM updates
- Automatically track dependencies
- Clean up when dependencies change or component unmounts

### $props - Component Props

For declaring component props:

\`\`\`svelte
<script>
  interface Props {
    title: string;
    count?: number;
    onUpdate: (value: number) => void;
  }

  let { title, count = 0, onUpdate }: Props = $props();
</script>
\`\`\`

## Migration Tips

Moving from Svelte 4 to 5:

| Svelte 4 | Svelte 5 |
|----------|----------|
| \`export let prop\` | \`let { prop } = $props()\` |
| \`$: derived = x * 2\` | \`let derived = $derived(x * 2)\` |
| \`$: { sideEffect() }\` | \`$effect(() => { sideEffect() })\` |
| \`let state = value\` | \`let state = $state(value)\` |

## Best Practices

1. **Keep effects minimal** - Effects should do one thing
2. **Prefer $derived over $effect** - When possible, use derived values
3. **Use TypeScript** - Runes work great with TypeScript for type safety
4. **Extract reactive logic** - Create \`.svelte.ts\` files for shared reactive state

## Conclusion

Svelte 5's runes make reactivity explicit and predictable. While it requires some adjustment, the benefits of clearer code and better debugging are worth it.

---

*For more Svelte tips, check out the official documentation!*`,
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop',
    author: {
      name: 'rdtect',
      avatar: 'https://github.com/rdtect.png'
    },
    publishedAt: '2025-01-10T14:30:00Z',
    readTime: 5,
    tags: ['svelte', 'javascript', 'reactivity', 'frontend']
  },
  {
    id: '3',
    title: 'TypeScript Patterns for Large-Scale Applications',
    slug: 'typescript-patterns-large-scale',
    excerpt: 'Practical TypeScript patterns and techniques for building maintainable large-scale applications.',
    content: `# TypeScript Patterns for Large-Scale Applications

As applications grow, maintaining code quality becomes crucial. Here are battle-tested TypeScript patterns that help keep large codebases manageable.

## 1. Branded Types

Prevent mixing up primitive types that represent different concepts:

\`\`\`typescript
type UserId = string & { readonly brand: unique symbol };
type PostId = string & { readonly brand: unique symbol };

function createUserId(id: string): UserId {
  return id as UserId;
}

function createPostId(id: string): PostId {
  return id as PostId;
}

// Now TypeScript prevents mixing them up!
function getPost(postId: PostId) { /* ... */ }

const userId = createUserId('user-123');
const postId = createPostId('post-456');

getPost(postId); // OK
getPost(userId); // Error! Argument of type 'UserId' is not assignable
\`\`\`

## 2. Discriminated Unions

Model state machines and complex scenarios:

\`\`\`typescript
type AsyncState<T, E = Error> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E };

function renderUsers(state: AsyncState<User[]>) {
  switch (state.status) {
    case 'idle':
      return 'Click to load users';
    case 'loading':
      return 'Loading...';
    case 'success':
      return state.data.map(u => u.name).join(', ');
    case 'error':
      return \`Error: \${state.error.message}\`;
  }
}
\`\`\`

## 3. Builder Pattern with Type Safety

Create complex objects with compile-time validation:

\`\`\`typescript
interface RequiredFields {
  name: string;
  email: string;
}

interface OptionalFields {
  age?: number;
  bio?: string;
}

type UserBuilder<T extends Partial<RequiredFields>> = {
  withName(name: string): UserBuilder<T & { name: string }>;
  withEmail(email: string): UserBuilder<T & { email: string }>;
  withAge(age: number): UserBuilder<T & { age: number }>;
  build: T extends RequiredFields ? () => RequiredFields & OptionalFields : never;
};

// Usage enforces required fields at compile time
createUserBuilder()
  .withName('Alice')
  .withEmail('alice@example.com')
  .withAge(30)
  .build(); // OK

createUserBuilder()
  .withName('Bob')
  .build(); // Error! Property 'build' does not exist
\`\`\`

## 4. Result Type

Handle errors without exceptions:

\`\`\`typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return { ok: false, error: 'Division by zero' };
  }
  return { ok: true, value: a / b };
}

const result = divide(10, 2);
if (result.ok) {
  console.log(result.value); // TypeScript knows value exists
} else {
  console.error(result.error); // TypeScript knows error exists
}
\`\`\`

## 5. Module Augmentation

Extend third-party types safely:

\`\`\`typescript
// Extend Window interface
declare global {
  interface Window {
    analytics: {
      track(event: string, data?: Record<string, unknown>): void;
    };
  }
}

// Now window.analytics is properly typed
window.analytics.track('page_view', { path: '/home' });
\`\`\`

## Key Takeaways

1. **Use the type system** - Let TypeScript catch bugs at compile time
2. **Model your domain** - Types should reflect business concepts
3. **Prefer composition** - Build complex types from simple ones
4. **Document with types** - Good types are self-documenting

These patterns have saved countless hours of debugging in production. Start small and gradually adopt the patterns that fit your needs.

---

*What TypeScript patterns do you find most useful? Share your experiences!*`,
    coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=400&fit=crop',
    author: {
      name: 'rdtect',
      avatar: 'https://github.com/rdtect.png'
    },
    publishedAt: '2025-01-05T09:15:00Z',
    updatedAt: '2025-01-08T11:20:00Z',
    readTime: 7,
    tags: ['typescript', 'patterns', 'architecture', 'best-practices']
  }
];

// Get unique tags from all posts
export function getAllTags(posts: BlogPost[]): string[] {
  const tagSet = new Set<string>();
  posts.forEach(post => post.tags.forEach(tag => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}

// Filter posts by tag
export function filterPostsByTag(posts: BlogPost[], tag: string): BlogPost[] {
  return posts.filter(post => post.tags.includes(tag));
}

// Search posts by query
export function searchPosts(posts: BlogPost[], query: string): BlogPost[] {
  const q = query.toLowerCase().trim();
  if (!q) return posts;

  return posts.filter(post =>
    post.title.toLowerCase().includes(q) ||
    post.excerpt.toLowerCase().includes(q) ||
    post.content.toLowerCase().includes(q) ||
    post.tags.some(tag => tag.toLowerCase().includes(q))
  );
}

// Get featured post
export function getFeaturedPost(posts: BlogPost[]): BlogPost | undefined {
  return posts.find(post => post.featured);
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Format relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

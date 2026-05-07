# Contributing to rdtect-os

A guide for AI agents and human developers working on the Desktop OS project.

## Quick Start

```bash
# Clone and install
cd ~/Developer/rdtect/rdtect-os
bun install

# Start development
bun run dev

# Run tests
bun run test

# Type check
bun run check
```

## Project Structure

```
rdtect-os/
├── apps/           # Application entry points
├── packages/       # Shared packages
│   ├── plugin-sdk/ # SDK for building plugins
│   ├── types/      # Shared TypeScript types
│   ├── config/      # Configuration utilities
│   └── ui/         # Shared UI components
├── plugins/        # Built-in plugins
├── labs/           # Experimental apps
├── src/            # Main SvelteKit application
│   └── lib/
│       └── core/   # Core desktop OS functionality
└── deploy/         # Deployment configurations
```

## Workflow

### Making Changes

1. **Create a branch** for your work
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make changes** and verify with checks
   ```bash
   bun run check    # TypeScript + Svelte checks
   bun run test     # Run tests
   bun run build    # Verify build
   ```

3. **Commit** using conventional commits
   ```bash
   git commit -m "feat(scope): description"
   ```

### Running Services

```bash
# Start all services (PocketBase, etc.)
bun run dev:services

# Start with full dev environment
bun run dev:full

# View logs
bun run logs
```

### Testing

```bash
# Run all tests once
bun run test

# Run tests in watch mode
bun run test:watch

# Run with coverage
bun run test:coverage
```

### Building for Production

```bash
# Build for Cloudflare Pages
bun run build

# Or with Docker
bun run build:docker
```

## Code Patterns

### Svelte 5 Runes

```svelte
<script lang="ts">
  // Use $state for reactive state
  let count = $state(0);
  
  // Use $derived for computed values
  let doubled = $derived(count * 2);
  
  // Use $effect for side effects
  $effect(() => {
    console.log('Count changed:', count);
  });
</script>
```

### Plugin Communication

Plugins communicate with the host via postMessage:

```typescript
import { createClient } from '@desktop-os/plugin-sdk';

const client = createClient();

// Wait for ready
client.onReady(() => {
  // Send messages to host
  client.send('plugin:action', { data: 'value' });
  
  // Subscribe to messages
  client.subscribe((message) => {
    console.log('Received:', message.type, message.payload);
  });
});
```

### Adding a New Plugin

1. Create the plugin in `plugins/<plugin-name>/`
2. Add to workspace in `package.json`
3. Register in the plugin registry
4. Add tests in `plugins/<plugin-name>/src/*.test.ts`

### Adding a New Package

1. Create `packages/<package-name>/`
2. Add to workspace in root `package.json`
3. Export from `packages/<package-name>/src/index.ts`
4. Add tests alongside source files

## Code Quality

### Required Checks (CI)

- `bun run check` — TypeScript + Svelte type checking
- `bun run test` — All tests must pass
- `bun run build` — Production build must succeed

### Style

- Use TypeScript strict mode
- Prefer `$state` / `$derived` over stores for component state
- Use ` Valibot` for runtime validation
- Follow existing patterns in the codebase

## Troubleshooting

### Build fails with "Cannot find module"

```bash
bun install
bun run prepare  # Regenerate SvelteKit types
```

### Tests not found

Ensure test files match the pattern: `**/*.test.ts`

### PocketBase not starting

```bash
docker compose ps        # Check status
docker compose logs pb   # View PocketBase logs
```

# =============================================================================
# rdtect OS Desktop — Multi-stage Dockerfile with Bun
# Build context: repository root (not this directory)
# Usage: docker build -f apps/desktop/Dockerfile .
# =============================================================================

# Stage 1: Dependencies
FROM oven/bun:1.3-alpine AS deps
WORKDIR /app

# Force development mode for install — Coolify injects NODE_ENV=production as
# a build ARG into all stages, which causes bun/npm to skip devDependencies.
# We need devDependencies (vite, svelte, adapter-node) to build.
ENV NODE_ENV=development

# Copy only workspace manifests for dependency resolution (better layer caching)
COPY package.json bun.lock* bun.lockb* bunfig.toml ./
COPY apps/desktop/package.json ./apps/desktop/
COPY apps/excalidraw-remote/package.json ./apps/excalidraw-remote/
COPY packages/plugin-sdk/package.json ./packages/plugin-sdk/

# Install ALL dependencies (including devDependencies needed for build)
RUN bun install --frozen-lockfile || bun install

# Stage 2: Builder
FROM oven/bun:1.3-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY . .

# NODE_ENV=production during build is fine — deps are already installed from stage 1
ENV NODE_ENV=production

# Build the SvelteKit application (runs apps/desktop/package.json#build)
RUN bun run --filter @desktop-os/desktop build

# Build excalidraw federation remote (or use pre-built dist if available)
RUN if [ ! -f apps/excalidraw-remote/dist/assets/remoteEntry.js ]; then \
      bun run --filter @desktop-os/excalidraw-remote build; \
    fi

# Copy excalidraw federation remote into SvelteKit client output
RUN mkdir -p /app/apps/desktop/build/client/federation/excalidraw && \
    cp -r apps/excalidraw-remote/dist/* /app/apps/desktop/build/client/federation/excalidraw/

# Stage 3: Production Runner
FROM oven/bun:1.3-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sveltekit

COPY --from=builder --chown=sveltekit:nodejs /app/apps/desktop/build ./build
COPY --from=builder --chown=sveltekit:nodejs /app/apps/desktop/package.json ./

# Install production-only dependencies for the runner
# (avoids shipping vite, svelte, tailwind, etc. in the production image)
RUN bun install --production --frozen-lockfile || bun install --production

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

USER sveltekit

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["bun", "./build/index.js"]

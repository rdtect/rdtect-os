# =============================================================================
# rdtect OS Frontend - Multi-stage Dockerfile with Bun
# =============================================================================

# Stage 1: Dependencies
FROM oven/bun:1.3-alpine AS deps
WORKDIR /app

# Force development mode for install — Coolify injects NODE_ENV=production as
# a build ARG into all stages, which causes bun/npm to skip devDependencies.
# We need devDependencies (vite, svelte, adapter-node) to build.
ENV NODE_ENV=development

# Copy workspace manifests for dependency resolution
COPY package.json bun.lock* bun.lockb* ./
COPY packages/ ./packages/
COPY apps/ ./apps/

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

# Copy pre-built excalidraw federation remote into SvelteKit client output
RUN mkdir -p /app/apps/desktop/build/client/federation/excalidraw && \
    cp -r apps/excalidraw-remote/dist/* /app/apps/desktop/build/client/federation/excalidraw/

# Stage 3: Production Runner
FROM oven/bun:1.3-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sveltekit

COPY --from=builder --chown=sveltekit:nodejs /app/apps/desktop/build ./build
COPY --from=builder --chown=sveltekit:nodejs /app/apps/desktop/package.json ./

# Only production runtime deps
COPY --from=deps /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

USER sveltekit

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["bun", "./build/index.js"]

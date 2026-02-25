# =============================================================================
# rdtect OS Frontend - Multi-stage Dockerfile with Bun
# =============================================================================

# Stage 1: Dependencies
FROM oven/bun:1.1-alpine AS deps
WORKDIR /app

# Copy all package files for workspace resolution
COPY package.json bun.lock* bun.lockb* ./
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY plugins/ ./plugins/

# Install dependencies
RUN bun install --frozen-lockfile || bun install

# Stage 2: Builder
FROM oven/bun:1.1-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY . .

ENV NODE_ENV=production

# Build the SvelteKit application (adapter-node is in devDependencies)
RUN bun run build

# Stage 3: Production Runner
FROM oven/bun:1.1-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sveltekit

COPY --from=builder --chown=sveltekit:nodejs /app/build ./build
COPY --from=builder --chown=sveltekit:nodejs /app/package.json ./

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

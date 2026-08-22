# ==========================================
# 1. Base stage with Bun 1.4.0 on Alpine Linux
# ==========================================
FROM oven/bun:1.4.0-alpine AS base
WORKDIR /app

# ==========================================
# 2. Dependencies installation stage
# ==========================================
FROM base AS deps
WORKDIR /app

# Copy dependency manifests
COPY package.json bun.lock* ./

# Install production dependencies
RUN bun install --frozen-lockfile --production

# ==========================================
# 3. Production runner stage
# ==========================================
FROM base AS runner
WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Copy application source code and migrations
COPY src ./src
COPY drizzle ./drizzle
COPY drizzle.config.ts ./
COPY tsconfig.json ./

# Run container as non-root user (built into Bun image)
USER bun

# Expose server port
EXPOSE 3000

# Health check using Alpine's built-in wget
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["bun", "run", "src/server.ts"]

